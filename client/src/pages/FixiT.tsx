import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Clock, DollarSign, Wrench, User, CheckCircle, Calendar, MapPin, Star, MessageSquare } from "lucide-react";
import { AuthUserResponse, MembershipTier, ServiceCategory, ServiceRequest } from "@shared/types";


// Common problem types for FixiT! diagnostics
const FIXIT_CATEGORY_VALUES = [
  "Handyman",
  "Basic Electrical",
  "Basic Plumbing",
  "Water Heater",
  "Dishwasher",
  "Oven",
  "Microwave",
  "Refrigerator",
  "Sink Disposal",
  "Clothes Washer",
  "Clothes Dryer",
  "Basic Irrigation",
] as const satisfies readonly ServiceCategory[];

type FixiTCategory = (typeof FIXIT_CATEGORY_VALUES)[number];

const PROBLEM_TYPES: Array<{ value: FixiTCategory; label: string }> = [
  { value: "Handyman", label: "General Repairs and Maintenance" },
  { value: "Basic Electrical", label: "Electrical Issues" },
  { value: "Basic Plumbing", label: "Plumbing Problems" },
  { value: "Water Heater", label: "Water Heater and HVAC Systems" },
  { value: "Dishwasher", label: "Dishwasher Service" },
  { value: "Oven", label: "Oven and Range Diagnostics" },
  { value: "Microwave", label: "Microwave and Small Appliances" },
  { value: "Refrigerator", label: "Refrigeration and Cooling" },
  { value: "Sink Disposal", label: "Garbage Disposal Repair" },
  { value: "Clothes Washer", label: "Washer and Laundry" },
  { value: "Clothes Dryer", label: "Dryer and Venting" },
  { value: "Basic Irrigation", label: "Irrigation and Outdoor Systems" },
];

// FixiT! specific diagnostic form schema
const diagnosticRequestSchema = z.object({
  problemType: z.enum(FIXIT_CATEGORY_VALUES, {
    required_error: "Problem type is required",
    invalid_type_error: "Problem type is required",
  }),
  problemDescription: z.string().min(10, "Please provide a detailed description (at least 10 characters)"),
  urgencyLevel: z.enum(["low", "normal", "high", "emergency"]),
  estimatedHours: z.number().min(0.5, "Minimum 0.5 hours").max(8, "Maximum 8 hours per request"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Valid ZIP code required"),
  preferredDateTime: z.string().optional(),
  symptoms: z.string().optional(),
  previousAttempts: z.string().optional(),
  memberNotes: z.string().optional(),
});

type DiagnosticRequestForm = z.infer<typeof diagnosticRequestSchema>;

// Hourly rate calculator
const calculateHourlyRate = (membershipTier: MembershipTier, baseRate: number = 75) => {
  const discounts = {
    HomeHUB: 0,
    HomePRO: 0.10,
    HomeHERO: 0.15,
    HomeGURU: 0.20,
  };
  
  const discount = discounts[membershipTier] || 0;
  const discountedRate = baseRate * (1 - discount);
  return {
    baseRate,
    discountedRate,
    discount,
    savings: baseRate - discountedRate,
  };
};

export default function FixiT() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Authentication and member profile
  const { data: currentUser, isLoading: isLoadingAuth } = useQuery<AuthUserResponse>({
    queryKey: ["/api/auth/user"],
  });

  const { data: memberProfile, isLoading: isLoadingMember } = useQuery<any>({
    queryKey: ["/api/members/by-user", currentUser?.user?.id],
    enabled: !!currentUser?.user?.id,
  });

  // User's FixiT! service requests
  const { data: serviceRequests = [], isLoading: isLoadingRequests } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/by-member", memberProfile?.id ?? 'no-member'],
    enabled: !!memberProfile?.id,
  });

  // Available technicians
  const { data: availableTechnicians, isLoading: isLoadingTechnicians } = useQuery({
    queryKey: ["/api/contractors", "FixiT"],
    enabled: !!memberProfile,
  });

  const form = useForm<DiagnosticRequestForm>({
    resolver: zodResolver(diagnosticRequestSchema),
    defaultValues: {
      problemType: FIXIT_CATEGORY_VALUES[0],
      problemDescription: "",
      urgencyLevel: "normal",
      estimatedHours: 1,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      preferredDateTime: "",
      symptoms: "",
      previousAttempts: "",
      memberNotes: "",
    },
  });

  // Watch estimated hours for real-time pricing
  const estimatedHours = form.watch("estimatedHours");
  const userMembershipTier = memberProfile?.membershipTier || "HomeHUB";
  const pricing = calculateHourlyRate(userMembershipTier as MembershipTier);
  const totalCost = pricing.discountedRate * (estimatedHours || 1);
  const totalSavings = pricing.savings * (estimatedHours || 1);

  // Create diagnostic request mutation
  const createDiagnosticRequest = useMutation({
    mutationFn: async (data: DiagnosticRequestForm) => {
      if (!memberProfile?.id) {
        throw new Error("Member profile is required to create a service request");
      }
      const preferredDateTimeISO = data.preferredDateTime ? new Date(data.preferredDateTime).toISOString() : undefined;

      const selectedProblemType = PROBLEM_TYPES.find((type) => type.value === data.problemType);

      const metadataEntries = Object.entries({
        symptoms: data.symptoms?.trim(),
        previousAttempts: data.previousAttempts?.trim(),
        preferredDateTime: preferredDateTimeISO,
        issueLabel: selectedProblemType?.label,
      }).filter(([, value]) => value !== undefined && value !== null && value !== "");

      const payload = {
        memberId: memberProfile.id,
        serviceType: "FixiT",
        category: data.problemType,
        title: `${selectedProblemType?.label ?? data.problemType} Diagnostic`,
        description: data.problemDescription,
        urgency: data.urgencyLevel,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        estimatedDuration: Math.round(data.estimatedHours * 60),
        ...(data.memberNotes ? { memberNotes: data.memberNotes } : {}),
        ...(preferredDateTimeISO ? { preferredDateTime: preferredDateTimeISO } : {}),
        ...(metadataEntries.length ? { serviceMetadata: Object.fromEntries(metadataEntries) } : {}),
      };

      const response = await apiRequest("POST", "/api/service-requests", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/by-member", memberProfile?.id ?? "no-member"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Diagnostic Request Created",
        description: "Your FixiT! diagnostic request has been submitted successfully. We'll assign a technician shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create diagnostic request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DiagnosticRequestForm) => {
    createDiagnosticRequest.mutate(data);
  };

  if (isLoadingAuth || isLoadingMember) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading FixiT! dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser?.user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
            <CardDescription className="text-center">
              Please sign in to access FixiT! diagnostic and repair services.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const userRequests = serviceRequests.filter((req: ServiceRequest) => req.serviceType === "FixiT");

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-fixit">
              FixiT! Diagnostic & Repair
            </h1>
            <p className="text-muted-foreground mt-2">
              Expert diagnostics and repair services with transparent hourly billing
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" data-testid="button-new-diagnostic">
                <Wrench className="h-4 w-4 mr-2" />
                Request Diagnostic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New FixiT! Diagnostic Request</DialogTitle>
                <DialogDescription>
                  Describe your problem and we'll assign a licensed technician for diagnosis and repair.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Problem Type Selection */}
                  <FormField
                    control={form.control}
                    name="problemType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-problem-type">
                              <SelectValue placeholder="Select the type of problem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROBLEM_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Problem Description */}
                  <FormField
                    control={form.control}
                    name="problemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the issue in detail. What's not working? When did it start?"
                            className="min-h-[100px]"
                            data-testid="textarea-problem-description"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide as much detail as possible to help our technicians prepare.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Symptoms (Optional) */}
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symptoms (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any strange noises, smells, visual signs, error messages, etc."
                            data-testid="textarea-symptoms"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Previous Attempts (Optional) */}
                  <FormField
                    control={form.control}
                    name="previousAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Repair Attempts (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What have you already tried? Any recent repairs or maintenance?"
                            data-testid="textarea-previous-attempts"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Urgency */}
                    <FormField
                      control={form.control}
                      name="urgencyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-urgency">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low - Can wait a few days</SelectItem>
                              <SelectItem value="normal">Normal - Within 1-2 days</SelectItem>
                              <SelectItem value="high">High - Same day preferred</SelectItem>
                              <SelectItem value="emergency">Emergency - ASAP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Estimated Hours */}
                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="8"
                              data-testid="input-estimated-hours"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            How long do you think this might take? (0.5 - 8 hours)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Service Location</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" data-testid="input-address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" data-testid="input-city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" data-testid="input-state" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="12345" data-testid="input-zip" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Estimated Cost</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Base Rate (per hour):</span>
                        <span className={pricing.discount > 0 ? "line-through text-muted-foreground" : ""}>
                          ${pricing.baseRate}/hr
                        </span>
                      </div>
                      {pricing.discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Member Rate ({userMembershipTier}):</span>
                          <span className="font-medium">${pricing.discountedRate.toFixed(2)}/hr</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span>Estimated Hours:</span>
                        <span>{estimatedHours || 1} hours</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center font-medium">
                        <span>Total Estimated Cost:</span>
                        <span className="text-primary">${totalCost.toFixed(2)}</span>
                      </div>
                      {totalSavings > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>Your Savings:</span>
                          <span>${totalSavings.toFixed(2)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="memberNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special instructions, access codes, preferred times, etc."
                            data-testid="textarea-member-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-diagnostic"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createDiagnosticRequest.isPending}
                      data-testid="button-submit-diagnostic"
                    >
                      {createDiagnosticRequest.isPending ? "Creating..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Membership Benefits */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Your FixiT! Benefits ({userMembershipTier})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Hourly Rate</p>
                <p className="text-sm text-muted-foreground">
                  ${pricing.discountedRate.toFixed(2)}/hr
                  {pricing.discount > 0 && (
                    <span className="text-green-600 ml-1">({(pricing.discount * 100).toFixed(0)}% off)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Priority Service</p>
                <p className="text-sm text-muted-foreground">
                  {userMembershipTier === "HomeHUB" ? "Standard" : 
                   userMembershipTier === "HomePRO" ? "Priority" : "High Priority"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Warranty Period</p>
                <p className="text-sm text-muted-foreground">
                  {userMembershipTier === "HomeHUB" ? "30 days" :
                   userMembershipTier === "HomePRO" ? "60 days" : "90 days"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Requests */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Your FixiT! Requests</h2>
          {userRequests.length > 0 && (
            <Badge variant="secondary" data-testid="badge-request-count">
              {userRequests.length} Active
            </Badge>
          )}
        </div>

        {isLoadingRequests ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No FixiT! Requests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit your first diagnostic request to get started with expert repair services.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-first-diagnostic">
                <Wrench className="h-4 w-4 mr-2" />
                Request Your First Diagnostic
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRequests.map((request: ServiceRequest) => (
              <Card 
                key={request.id} 
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedRequest(request)}
                data-testid={`card-request-${request.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{request.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {PROBLEM_TYPES.find((t) => t.value === request.category)?.label ?? request.category}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        request.status === "completed" ? "default" :
                        request.status === "in_progress" ? "secondary" :
                        request.status === "pending" ? "outline" : "destructive"
                      }
                      data-testid={`status-${request.id}`}
                    >
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{request.estimatedDuration ? `${request.estimatedDuration / 60}hrs` : "TBD"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${request.estimatedCost || "TBD"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span className="capitalize">{request.urgency}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{request.city}, {request.state}</span>
                    </div>
                  </div>

                  {request.assignedContractorId && (
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <User className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">Technician Assigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRequest.title}</DialogTitle>
              <DialogDescription>
                Request #{selectedRequest.id.slice(-8)} • Created {new Date(selectedRequest.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge 
                    variant={
                      selectedRequest.status === "completed" ? "default" :
                      selectedRequest.status === "in_progress" ? "secondary" :
                      selectedRequest.status === "pending" ? "outline" : "destructive"
                    }
                  >
                    {selectedRequest.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estimated Cost</h4>
                  <p className="text-lg font-semibold">${selectedRequest.estimatedCost}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Problem Description</h4>
                <p className="text-muted-foreground">{selectedRequest.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Location</h4>
                <p className="text-muted-foreground">
                  {selectedRequest.address}, {selectedRequest.city}, {selectedRequest.state} {selectedRequest.zipCode}
                </p>
              </div>

              {selectedRequest.memberNotes && (
                <div>
                  <h4 className="font-medium mb-2">Your Notes</h4>
                  <p className="text-muted-foreground">{selectedRequest.memberNotes}</p>
                </div>
              )}

              {selectedRequest.completionNotes && (
                <div>
                  <h4 className="font-medium mb-2">Completion Notes</h4>
                  <p className="text-muted-foreground">{selectedRequest.completionNotes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
