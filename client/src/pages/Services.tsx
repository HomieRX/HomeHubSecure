import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Wrench, 
  Shield, 
  Users, 
  Search, 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Info,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIconLarge
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MembershipTier,
  ServiceType,
  ServiceCategory,
  UrgencyLevel,
  AuthUserResponse,
  ServiceTypesResponse,
  ServiceAvailabilityResponse,
  MembershipBenefitsResponse,
  AvailableServicesResponse,
  ServiceTypeDefinition,
  ServiceAvailability,
  CreateServiceRequestData,
  ServiceRequestResponse
} from "@shared/types";

// Service type mapping to icons
const serviceIcons: Record<ServiceType, any> = {
  FixiT: Wrench,
  PreventiT: Shield,
  HandleiT: Users,
  CheckiT: Search,
  LoyalizeiT: Star
};

// Service booking form schema
const serviceBookingSchema = z.object({
  serviceType: z.enum(["FixiT", "PreventiT", "HandleiT", "CheckiT", "LoyalizeiT"]),
  category: z.enum(["Handyman", "Dishwasher", "Oven", "Microwave", "Refrigerator", "Sink Disposal", "Clothes Washer", "Clothes Dryer", "Water Heater", "Basic Electrical", "Basic Irrigation", "Basic Plumbing"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide a detailed description"),
  urgency: z.enum(["low", "normal", "high", "emergency"]).default("normal"),
  address: z.string().min(5, "Please provide a complete address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"),
  preferredDateTime: z.date().optional(),
  estimatedDuration: z.number().min(15).max(960).default(60), // 15 minutes to 16 hours
  memberNotes: z.string().optional(),
});

type ServiceBookingForm = z.infer<typeof serviceBookingSchema>;

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<ServiceTypeDefinition | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch authenticated user
  const { data: currentUser, isLoading: loadingAuth, error: authError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch member profile for authenticated user
  const { data: memberProfile, isLoading: loadingMemberProfile, error: memberError } = useQuery({
    queryKey: ["/api/members/by-user", (currentUser as any)?.id],
    enabled: !!(currentUser as any)?.id,
    retry: false,
  });

  // Fetch available service types
  const { data: serviceTypes, isLoading: loadingServices } = useQuery<ServiceTypesResponse>({
    queryKey: ["/api/services/types"],
  });

  // Fetch membership benefits
  const { data: membershipBenefits } = useQuery<MembershipBenefitsResponse>({
    queryKey: ["/api/services/membership-benefits"],
  });

  // Fetch service availability
  const { data: serviceAvailability } = useQuery<ServiceAvailabilityResponse>({
    queryKey: ["/api/services/availability"],
  });

  // Get current user's membership tier
  const userMembershipTier: MembershipTier = (memberProfile as any)?.membershipTier || "HomeHUB";

  // Fetch available services for user's membership tier
  const { data: availableServices } = useQuery<AvailableServicesResponse>({
    queryKey: ["/api/services/available", userMembershipTier],
    enabled: !!userMembershipTier,
  });

  // Form for service booking
  const form = useForm<ServiceBookingForm>({
    resolver: zodResolver(serviceBookingSchema),
    defaultValues: {
      urgency: "normal",
      estimatedDuration: 60,
    },
  });

  // Real-time pricing query for selected service
  const estimatedDuration = form.watch("estimatedDuration");
  const { data: servicePricing, isLoading: loadingPricing } = useQuery({
    queryKey: ["/api/services/pricing", selectedService?.type, userMembershipTier, estimatedDuration],
    enabled: !!selectedService && !!userMembershipTier && estimatedDuration > 0,
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/services/pricing", {
        serviceType: selectedService?.type,
        membershipTier: userMembershipTier,
        estimatedDuration,
        baseRate: 75,
      });
      return response.json();
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Service booking mutation with real member data and pricing
  const bookServiceMutation = useMutation<ServiceRequestResponse, Error, ServiceBookingForm>({
    mutationFn: async (data: ServiceBookingForm) => {
      if (!(memberProfile as any)?.id) {
        throw new Error("Member profile not found. Please try logging in again.");
      }
      
      const requestData: CreateServiceRequestData = {
        ...data,
        memberId: (memberProfile as any).id,
      };
      
      const response = await apiRequest("POST", "/api/service-requests", requestData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Service Booked Successfully!",
        description: `Your ${selectedService?.config.name} request has been submitted with ID ${data.serviceRequest?.id?.slice(-8)}.`,
      });
      setIsBookingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests", "by-member", (memberProfile as any)?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleServiceSelect = (service: ServiceTypeDefinition) => {
    setSelectedService(service);
    form.setValue("serviceType", service.type);
    setIsBookingDialogOpen(true);
  };

  const onSubmit = (data: ServiceBookingForm) => {
    bookServiceMutation.mutate(data);
  };

  // Filter services based on search and membership
  const filteredServices = availableServices?.services?.filter((service: ServiceTypeDefinition) => {
    const matchesSearch = searchQuery === "" || 
      service.config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.config.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const getServiceStatus = (serviceType: ServiceType) => {
    const availability = serviceAvailability?.availability?.find((s: ServiceAvailability) => s.serviceType === serviceType);
    if (!availability) return "coming-soon";
    return availability.isAvailable ? "available" : "seasonal";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case "seasonal":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><Clock className="w-3 h-3 mr-1" />Seasonal</Badge>;
      case "coming-soon":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const getMembershipBadge = (tier: MembershipTier) => {
    const colors: Record<MembershipTier, string> = {
      HomeHUB: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      HomePRO: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", 
      HomeHERO: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      HomeGURU: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    };
    
    return (
      <Badge className={colors[tier]}>
        {tier}
      </Badge>
    );
  };

  // Handle authentication and loading states
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access HomeHub services.</p>
        </div>
        <Button onClick={() => window.location.href = "/api/login"}>
          Sign In
        </Button>
      </div>
    );
  }

  if (loadingAuth || loadingMemberProfile || loadingServices) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">
            {loadingAuth && "Authenticating..."}
            {loadingMemberProfile && "Loading member profile..."}
            {loadingServices && "Loading services..."}
          </div>
        </div>
      </div>
    );
  }

  if (memberError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Member Profile Required</h3>
          <p className="text-muted-foreground">Please complete your member profile to access services.</p>
        </div>
        <Button onClick={() => window.location.href = "/profile"}>
          Complete Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">HomeHub Services</h1>
          <p className="text-muted-foreground">Book professional home services with your {getMembershipBadge(userMembershipTier)} membership</p>
        </div>
      </div>

      {/* Membership Benefits Overview */}
      {membershipBenefits?.benefits && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Your {userMembershipTier} Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {membershipBenefits.benefits[userMembershipTier]?.services?.length || 0} Services Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {membershipBenefits.benefits[userMembershipTier]?.discountPercentage || 0}% Member Discount
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">
                  {membershipBenefits.benefits[userMembershipTier]?.pointsMultiplier || 1}x Points Multiplier
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            data-testid="input-search-services"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service: ServiceTypeDefinition) => {
          const Icon = serviceIcons[service.type];
          const status = getServiceStatus(service.type);
          const isAvailable = status === "available";
          
          // Calculate pricing for this service based on default duration
          const defaultDuration = service.config.defaultSlotDuration;
          const baseRate = 75;
          
          let basePrice = 0;
          switch (service.config.billingModel) {
            case "hourly":
              basePrice = (defaultDuration / 60) * baseRate;
              break;
            case "session":
              basePrice = baseRate * 2; // Session rate
              break;
            case "project":
              basePrice = baseRate * (defaultDuration / 60) * 1.5; // Premium for projects
              break;
            case "points":
              basePrice = 0; // Points-based service
              break;
          }

          const membershipBenefit = membershipBenefits?.benefits?.[userMembershipTier];
          const membershipDiscount = basePrice * ((membershipBenefit?.discountPercentage || 0) / 100);
          const finalPrice = basePrice - membershipDiscount;
          const pointsReward = Math.floor(service.config.pointsReward * (membershipBenefit?.pointsMultiplier || 1));
          
          return (
            <Card 
              key={service.type} 
              className="hover-elevate transition-all duration-200" 
              data-testid={`service-card-${service.type.toLowerCase()}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Icon className="h-6 w-6 text-primary" data-testid="service-icon" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid="service-title">
                        {service.config.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm">
                        {service.config.billingModel === "points" ? (
                          <div className="text-primary font-medium">Points-based reward</div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {membershipDiscount > 0 && (
                              <span className="text-muted-foreground line-through">${basePrice.toFixed(2)}</span>
                            )}
                            <span className="text-primary font-medium">
                              ${finalPrice.toFixed(2)}
                            </span>
                            {membershipDiscount > 0 && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Save ${membershipDiscount.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div data-testid="service-status">
                    {getStatusBadge(status)}
                  </div>
                </div>
                <CardDescription className="text-sm text-muted-foreground" data-testid="service-description">
                  {service.config.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Features List */}
                  <div>
                    <h4 className="font-medium text-sm text-foreground mb-2">Includes:</h4>
                    <ul className="space-y-1" data-testid="service-features">
                      {service.config.features.slice(0, 3).map((feature: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Service Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.config.defaultSlotDuration}min
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {pointsReward} pts
                      {(membershipBenefit?.pointsMultiplier || 1) > 1 && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {membershipBenefit?.pointsMultiplier}x
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1" 
                      disabled={!isAvailable || bookServiceMutation.isPending}
                      onClick={() => handleServiceSelect(service)}
                      data-testid={`button-book-${service.type.toLowerCase()}`}
                    >
                      {isAvailable ? "Book Now" : "Not Available"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {/* TODO: Show service details */}}
                      data-testid="button-learn-more-service"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedService?.config?.name}</DialogTitle>
            <DialogDescription>
              Please provide details for your service request
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Service Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Handyman">Handyman</SelectItem>
                        <SelectItem value="Dishwasher">Dishwasher</SelectItem>
                        <SelectItem value="Oven">Oven</SelectItem>
                        <SelectItem value="Microwave">Microwave</SelectItem>
                        <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                        <SelectItem value="Basic Electrical">Basic Electrical</SelectItem>
                        <SelectItem value="Basic Plumbing">Basic Plumbing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue" {...field} data-testid="input-service-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide details about the service needed..."
                        {...field}
                        data-testid="textarea-service-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Urgency */}
              <FormField
                control={form.control}
                name="urgency"
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
                        <SelectItem value="low">Low - Can wait a week</SelectItem>
                        <SelectItem value="normal">Normal - Within a few days</SelectItem>
                        <SelectItem value="high">High - ASAP</SelectItem>
                        <SelectItem value="emergency">Emergency - Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Fields */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-city" />
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
                          <Input placeholder="ST" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} data-testid="input-zipcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Estimated Duration */}
              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15" 
                        max="960" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-duration"
                      />
                    </FormControl>
                    <FormDescription>
                      How long do you expect this service to take?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Real-time Pricing Summary */}
              {selectedService && estimatedDuration > 0 && (
                <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing Summary
                    </h4>
                    {loadingPricing ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Calculating pricing...
                      </div>
                    ) : servicePricing ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="font-medium">${servicePricing.basePrice?.toFixed(2) || '0.00'}</span>
                        </div>
                        {servicePricing.membershipDiscount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Member Discount ({userMembershipTier}):</span>
                            <span className="font-medium text-green-600">-${servicePricing.membershipDiscount?.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">Total:</span>
                            <span className="font-bold text-lg text-primary">${servicePricing.finalPrice?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Points Reward:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-600" />
                            <span className="font-medium">{servicePricing.pointsReward || 0} pts</span>
                          </div>
                        </div>
                        {servicePricing.escrowRequired && (
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-900">
                            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                              <Shield className="h-3 w-3" />
                              <span>Escrow protection required for this service</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Pricing will be calculated based on your service selection and duration.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="memberNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special instructions or additional information..."
                        {...field}
                        data-testid="textarea-member-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsBookingDialogOpen(false)}
                  disabled={bookServiceMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={bookServiceMutation.isPending}
                  data-testid="button-submit-booking"
                >
                  {bookServiceMutation.isPending ? "Booking..." : "Book Service"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredServices.length === 0 && !loadingServices && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              No services found matching your criteria
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setMembershipFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
