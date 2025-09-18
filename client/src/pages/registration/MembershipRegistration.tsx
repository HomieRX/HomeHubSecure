import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MemberProfileCreateSchema } from "@shared/types";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RegistrationLayout, 
  StepIndicator, 
  FormSection, 
  AddressFields,
  MembershipTierSelector,
  MembershipTier,
  MEMBERSHIP_TIERS
} from "@/components/registration";

import { AlertCircle, Home, CreditCard, Settings, CheckCircle, ArrowRight, ArrowLeft, Crown } from "lucide-react";

// Extended schema for membership registration
const MembershipRegistrationSchema = MemberProfileCreateSchema.extend({
  // Billing preferences for paid tiers
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  
  // Service preferences
  servicePreferences: z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    emergencyAlerts: z.boolean().default(true),
    maintenanceReminders: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
  }).optional(),
  
  // Home details
  homeData: z.object({
    homeType: z.enum(["single_family", "townhouse", "condo", "apartment", "mobile_home", "other"]).optional(),
    yearBuilt: z.coerce.number().min(1800, "Invalid year").max(new Date().getFullYear(), "Invalid year").optional(),
    squareFootage: z.coerce.number().min(100, "Invalid square footage").optional(),
    lotSize: z.coerce.number().min(0, "Invalid lot size").optional(),
    bedrooms: z.coerce.number().min(0, "Invalid number").max(20, "Invalid number").optional(),
    bathrooms: z.coerce.number().min(0, "Invalid number").max(20, "Invalid number").optional(),
    hasGarage: z.boolean().default(false),
    hasBasement: z.boolean().default(false),
    hasPool: z.boolean().default(false),
    hasGarden: z.boolean().default(false),
  }).optional(),
});

type MembershipRegistrationForm = z.infer<typeof MembershipRegistrationSchema>;

const REGISTRATION_STEPS = [
  {
    id: "personal-info",
    title: "Personal Info",
    description: "Basic information"
  },
  {
    id: "membership-tier",
    title: "Membership",
    description: "Choose your tier"
  },
  {
    id: "home-details",
    title: "Home Details",
    description: "Property information"
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Settings and billing"
  }
];

const HOME_TYPES = [
  { value: "single_family", label: "Single Family Home" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condominium" },
  { value: "apartment", label: "Apartment" },
  { value: "mobile_home", label: "Mobile Home" },
  { value: "other", label: "Other" }
];

interface MembershipRegistrationProps {
  defaultTier?: MembershipTier;
  title?: string;
  subtitle?: string;
}

export default function MembershipRegistration({ 
  defaultTier = "HomeHUB",
  title = "HomeHub Membership Registration",
  subtitle = "Join the HomeHub community and simplify your home management"
}: MembershipRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Note: No authentication check needed - registration creates the user account

  const form = useForm<MembershipRegistrationForm>({
    resolver: zodResolver(MembershipRegistrationSchema),
    defaultValues: {
      userId: "",
      nickname: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      avatarUrl: "",
      coverImageUrl: "",
      membershipTier: defaultTier,
      bio: "",
      location: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      billingCycle: "monthly",
      servicePreferences: {
        emailNotifications: true,
        smsNotifications: false,
        emergencyAlerts: true,
        maintenanceReminders: true,
        marketingEmails: false,
      },
      homeData: {
        homeType: undefined,
        yearBuilt: undefined,
        squareFootage: undefined,
        lotSize: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        hasGarage: false,
        hasBasement: false,
        hasPool: false,
        hasGarden: false,
      }
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: MembershipRegistrationForm) => {
      // Create user with homeowner role
      const userResponse = await apiRequest("POST", "/api/auth/create-user", {
        role: "homeowner",
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      });

      const user = await userResponse.json();

      // Create member profile
      const profileData = {
        ...data,
        userId: user.id,
      };

      const response = await apiRequest("POST", "/api/members", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const selectedTier = form.getValues("membershipTier");
      const tierInfo = MEMBERSHIP_TIERS.find(t => t.id === selectedTier);
      
      toast({
        title: "Welcome to HomeHub!",
        description: `Your ${tierInfo?.name} membership has been created successfully. Welcome to the community!`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "There was an error creating your membership. Please try again.",
      });
    }
  });

  const onSubmit = (data: MembershipRegistrationForm) => {
    registerMutation.mutate(data);
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof MembershipRegistrationForm)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode"];
        break;
      case 2:
        fieldsToValidate = ["membershipTier"];
        break;
      case 3:
        // Home details are optional
        break;
      case 4:
        // Preferences are optional
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < REGISTRATION_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectedTier = form.watch("membershipTier");
  const selectedTierInfo = MEMBERSHIP_TIERS.find(t => t.id === selectedTier);
  const isFreeTier = selectedTierInfo?.monthlyPrice === 0;


  return (
    <RegistrationLayout
      title={title}
      subtitle={subtitle}
    >
      <div className="space-y-8">
        {/* Progress Indicator */}
        <StepIndicator 
          steps={REGISTRATION_STEPS} 
          currentStep={currentStep}
          data-testid="membership-registration-steps"
        />

        {/* Registration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6" data-testid="step-personal-info">
                <FormSection
                  title="Personal Information"
                  description="Tell us about yourself"
                  required
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-first-name">
                            First Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John" 
                              data-testid="input-first-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-first-name" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-last-name">
                            Last Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Smith" 
                              data-testid="input-last-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-last-name" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-nickname">Preferred Name / Nickname</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John (optional - how you'd like to be called)" 
                            data-testid="input-nickname"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This is how other HomeHub members will see you
                        </FormDescription>
                        <FormMessage data-testid="error-nickname" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-email">
                            Email Address <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="john@example.com" 
                              data-testid="input-email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-email" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-phone">
                            Phone Number <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(555) 123-4567" 
                              data-testid="input-phone"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-phone" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Home Address"
                  description="Where is your home located?"
                  required
                >
                  <AddressFields required />
                </FormSection>

                <FormSection
                  title="About You"
                  description="Tell us a bit about yourself (optional)"
                >
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-bio">Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself, your interests, and what brings you to HomeHub..."
                            className="min-h-[100px]"
                            data-testid="input-bio"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This helps us personalize your experience and connect you with like-minded homeowners
                        </FormDescription>
                        <FormMessage data-testid="error-bio" />
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            )}

            {/* Step 2: Membership Tier Selection */}
            {currentStep === 2 && (
              <div className="space-y-6" data-testid="step-membership-tier">
                <FormSection
                  title="Choose Your Membership Tier"
                  description="Select the membership level that best fits your needs"
                  required
                >
                  {/* Billing Cycle Toggle */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center space-x-4 p-1 bg-muted rounded-lg">
                      <Button
                        type="button"
                        variant={billingCycle === "monthly" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setBillingCycle("monthly")}
                        data-testid="billing-monthly"
                      >
                        Monthly
                      </Button>
                      <Button
                        type="button"
                        variant={billingCycle === "yearly" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setBillingCycle("yearly")}
                        data-testid="billing-yearly"
                      >
                        Yearly (Save 17%)
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="membershipTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MembershipTierSelector
                            selectedTier={field.value}
                            onTierSelect={field.onChange}
                            billingCycle={billingCycle}
                          />
                        </FormControl>
                        <FormMessage data-testid="error-membership-tier" />
                      </FormItem>
                    )}
                  />

                  {/* Payment Notice for Paid Tiers */}
                  {!isFreeTier && (
                    <Alert className="mt-6">
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Payment Information:</strong> You'll be prompted to set up payment for your {selectedTierInfo?.name} membership in the final step. You can cancel anytime from your account settings.
                      </AlertDescription>
                    </Alert>
                  )}
                </FormSection>
              </div>
            )}

            {/* Step 3: Home Details */}
            {currentStep === 3 && (
              <div className="space-y-6" data-testid="step-home-details">
                <FormSection
                  title="Home Information"
                  description="Help us understand your property (all fields optional)"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="homeData.homeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-home-type">Home Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-home-type">
                                <SelectValue placeholder="Select home type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HOME_TYPES.map((type) => (
                                <SelectItem 
                                  key={type.value} 
                                  value={type.value}
                                  data-testid={`home-type-${type.value}`}
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage data-testid="error-home-type" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeData.yearBuilt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-year-built">Year Built</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1800"
                              max={new Date().getFullYear()}
                              placeholder="1995"
                              data-testid="input-year-built"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage data-testid="error-year-built" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="homeData.squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-square-footage">Square Footage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="100"
                              placeholder="2500"
                              data-testid="input-square-footage"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage data-testid="error-square-footage" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeData.lotSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-lot-size">Lot Size (sq ft)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              placeholder="8000"
                              data-testid="input-lot-size"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage data-testid="error-lot-size" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="homeData.bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-bedrooms">Bedrooms</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              max="20"
                              placeholder="3"
                              data-testid="input-bedrooms"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage data-testid="error-bedrooms" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeData.bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-bathrooms">Bathrooms</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              placeholder="2.5"
                              data-testid="input-bathrooms"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage data-testid="error-bathrooms" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Home Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="homeData.hasGarage"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-garage"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-garage">Garage</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="homeData.hasBasement"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-basement"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-basement">Basement</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="homeData.hasPool"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-pool"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-pool">Pool</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="homeData.hasGarden"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-garden"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-garden">Garden</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </FormSection>
              </div>
            )}

            {/* Step 4: Preferences & Billing */}
            {currentStep === 4 && (
              <div className="space-y-6" data-testid="step-preferences">
                <FormSection
                  title="Communication Preferences"
                  description="How would you like to hear from us?"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="servicePreferences.emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div>
                            <FormLabel data-testid="label-email-notifications">Email Notifications</FormLabel>
                            <FormDescription>Service updates, appointment confirmations</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-email-notifications"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicePreferences.smsNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div>
                            <FormLabel data-testid="label-sms-notifications">SMS Notifications</FormLabel>
                            <FormDescription>Urgent updates and appointment reminders</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-sms-notifications"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicePreferences.emergencyAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div>
                            <FormLabel data-testid="label-emergency-alerts">Emergency Alerts</FormLabel>
                            <FormDescription>Urgent notifications for emergency services</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-emergency-alerts"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicePreferences.maintenanceReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div>
                            <FormLabel data-testid="label-maintenance-reminders">Maintenance Reminders</FormLabel>
                            <FormDescription>Seasonal and regular home maintenance tips</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-maintenance-reminders"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicePreferences.marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div>
                            <FormLabel data-testid="label-marketing-emails">Marketing & Promotions</FormLabel>
                            <FormDescription>Special offers, new features, and community news</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-marketing-emails"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>

                {/* Billing Summary */}
                <FormSection
                  title="Membership Summary"
                  description="Review your membership selection"
                >
                  <Card data-testid="membership-summary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {selectedTierInfo?.icon}
                        {selectedTierInfo?.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedTierInfo?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium">
                          {isFreeTier ? "Free Membership" : `$${billingCycle === "yearly" ? selectedTierInfo?.yearlyPrice : selectedTierInfo?.monthlyPrice}/${billingCycle === "yearly" ? "year" : "month"}`}
                        </span>
                        {!isFreeTier && billingCycle === "yearly" && (
                          <span className="text-sm text-green-600 font-medium">
                            Save ${((selectedTierInfo?.monthlyPrice || 0) * 12) - (selectedTierInfo?.yearlyPrice || 0)}/year
                          </span>
                        )}
                      </div>
                      
                      {!isFreeTier && (
                        <Alert>
                          <CreditCard className="h-4 w-4" />
                          <AlertDescription>
                            You'll be redirected to set up payment after completing registration. Your membership will be activated once payment is confirmed.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </FormSection>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="button-previous"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < REGISTRATION_STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit"
                >
                  {registerMutation.isPending ? (
                    "Creating Membership..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isFreeTier ? "Complete Registration" : "Complete & Setup Payment"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </RegistrationLayout>
  );
}