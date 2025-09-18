import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ContractorProfileCreateSchema } from "@shared/types";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  RegistrationLayout, 
  StepIndicator, 
  FormSection, 
  AddressFields,
  SpecialtySelector,
  BusinessHoursInput,
  FileUpload
} from "@/components/registration";

import { AlertCircle, Building2, CreditCard, Shield, User, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

// Extended schema for contractor registration with additional fields
const ContractorRegistrationSchema = ContractorProfileCreateSchema.extend({
  // Additional business details
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  yearsExperience: z.coerce.number().min(0, "Invalid experience").max(50, "Invalid experience").optional(),
  
  // Portfolio and certifications
  portfolioFiles: z.array(z.any()).optional(), // File objects for upload
  certificationFiles: z.array(z.any()).optional(), // File objects for upload
  
  // Business hours (stored as nested object)
  businessHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    thursday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    friday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    saturday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    sunday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
  }).optional(),
  
  // Payment methods
  paymentMethods: z.array(z.enum(["cash", "check", "credit", "debit", "financing", "venmo", "paypal"])).optional(),
  
  // Service preferences  
  emergencyServices: z.boolean().default(false),
  weekendServices: z.boolean().default(false),
});

type ContractorRegistrationForm = z.infer<typeof ContractorRegistrationSchema>;

const REGISTRATION_STEPS = [
  {
    id: "business-info",
    title: "Business Info",
    description: "Basic business details"
  },
  {
    id: "specialties", 
    title: "Specialties",
    description: "Services you offer"
  },
  {
    id: "licenses",
    title: "Licenses & Insurance", 
    description: "Legal requirements"
  },
  {
    id: "details",
    title: "Business Details",
    description: "Portfolio and operations"
  }
];

export default function ContractorRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Note: No authentication check needed - registration creates the user account

  const form = useForm<ContractorRegistrationForm>({
    resolver: zodResolver(ContractorRegistrationSchema),
    defaultValues: {
      userId: "",
      businessName: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      serviceRadius: 25,
      hourlyRate: undefined,
      licenseNumber: "",
      licenseType: "",
      licenseExpiryDate: "",
      insuranceProvider: "",
      insurancePolicyNumber: "",
      insuranceExpiryDate: "",
      bondingProvider: "",
      bondingAmount: undefined,
      bio: "",
      specialties: [],
      certifications: [],
      yearsExperience: undefined,
      portfolioImages: [],
      website: "",
      emergencyServices: false,
      weekendServices: false,
      paymentMethods: ["cash", "check"],
      businessHours: {
        monday: { start: "09:00", end: "17:00", closed: false },
        tuesday: { start: "09:00", end: "17:00", closed: false },
        wednesday: { start: "09:00", end: "17:00", closed: false },
        thursday: { start: "09:00", end: "17:00", closed: false },
        friday: { start: "09:00", end: "17:00", closed: false },
        saturday: { start: "", end: "", closed: true },
        sunday: { start: "", end: "", closed: true },
      }
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: ContractorRegistrationForm) => {
      // Create user with contractor role
      const userResponse = await apiRequest("POST", "/api/auth/create-user", {
        role: "contractor",
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      });

      const user = await userResponse.json();

      // Create contractor profile
      const profileData = {
        ...data,
        userId: user.id,
        // Convert business hours to the format expected by the API
        businessDetails: {
          businessHours: data.businessHours,
          paymentMethods: data.paymentMethods,
          emergencyServices: data.emergencyServices,
          weekendServices: data.weekendServices,
          website: data.website
        }
      };

      const response = await apiRequest("POST", "/api/contractors", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registration Successful!",
        description: "Your contractor profile has been created. We'll review your information and get back to you soon.",
      });
      setLocation("/profile");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "There was an error creating your profile. Please try again.",
      });
    }
  });

  const onSubmit = (data: ContractorRegistrationForm) => {
    registerMutation.mutate(data);
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof ContractorRegistrationForm)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["businessName", "firstName", "lastName", "phone", "email", "address", "city", "state", "zipCode"];
        break;
      case 2:
        fieldsToValidate = ["specialties"];
        break;
      case 3:
        fieldsToValidate = ["licenseNumber", "licenseType", "licenseExpiryDate", "insuranceProvider", "insurancePolicyNumber", "insuranceExpiryDate"];
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


  return (
    <RegistrationLayout
      title="Contractor Registration"
      subtitle="Join HomeHub's trusted network of service professionals"
    >
      <div className="space-y-8">
        {/* Progress Indicator */}
        <StepIndicator 
          steps={REGISTRATION_STEPS} 
          currentStep={currentStep}
          data-testid="contractor-registration-steps"
        />

        {/* Registration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-6" data-testid="step-business-info">
                <FormSection
                  title="Business Information"
                  description="Tell us about your contracting business"
                  required
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-business-name">
                            Business Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC Contracting LLC" 
                              data-testid="input-business-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-business-name" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-website">Website</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.yoursite.com" 
                              data-testid="input-website"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-website" />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              placeholder="john@abccontracting.com" 
                              data-testid="input-email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-email" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Business Address & Service Area"
                  description="Where is your business located and what area do you serve?"
                  required
                >
                  <AddressFields required />
                  
                  <FormField
                    control={form.control}
                    name="serviceRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-service-radius">Service Radius (miles)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            max="200"
                            placeholder="25" 
                            data-testid="input-service-radius"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How many miles from your location will you travel for jobs?
                        </FormDescription>
                        <FormMessage data-testid="error-service-radius" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-hourly-rate">Hourly Rate (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="25"
                            max="500"
                            placeholder="75" 
                            data-testid="input-hourly-rate"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Your standard hourly rate in USD (can be updated later)
                        </FormDescription>
                        <FormMessage data-testid="error-hourly-rate" />
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            )}

            {/* Step 2: Service Specialties */}
            {currentStep === 2 && (
              <div className="space-y-6" data-testid="step-specialties">
                <FormSection
                  title="Service Specialties"
                  description="Select the types of services you specialize in"
                  required
                >
                  <SpecialtySelector
                    fieldName="specialties"
                    type="contractor"
                    required
                    maxSelections={8}
                  />
                </FormSection>

                <FormSection
                  title="Experience & Bio"
                  description="Tell potential customers about your experience"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-years-experience">Years of Experience</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              max="50"
                              placeholder="10" 
                              data-testid="input-years-experience"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage data-testid="error-years-experience" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-bio">Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell customers about your business, experience, and what makes you unique..."
                            className="min-h-[120px]"
                            data-testid="input-bio"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your public profile
                        </FormDescription>
                        <FormMessage data-testid="error-bio" />
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            )}

            {/* Step 3: Licenses & Insurance */}
            {currentStep === 3 && (
              <div className="space-y-6" data-testid="step-licenses">
                <FormSection
                  title="Business License"
                  description="Your business license information"
                  required
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-license-number">
                            License Number <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC123456" 
                              data-testid="input-license-number"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-license-number" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="licenseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-license-type">
                            License Type <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="General Contractor" 
                              data-testid="input-license-type"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-license-type" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="licenseExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-license-expiry">
                          License Expiry Date <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            data-testid="input-license-expiry"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage data-testid="error-license-expiry" />
                      </FormItem>
                    )}
                  />
                </FormSection>

                <FormSection
                  title="Insurance Information"
                  description="Your liability insurance details"
                  required
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="insuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-insurance-provider">
                            Insurance Provider <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="State Farm" 
                              data-testid="input-insurance-provider"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-insurance-provider" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="insurancePolicyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-insurance-policy">
                            Policy Number <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="POL123456789" 
                              data-testid="input-insurance-policy"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-insurance-policy" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="insuranceExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-insurance-expiry">
                          Insurance Expiry Date <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            data-testid="input-insurance-expiry"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage data-testid="error-insurance-expiry" />
                      </FormItem>
                    )}
                  />
                </FormSection>

                <FormSection
                  title="Bonding (Optional)"
                  description="If you have bonding coverage, please provide details"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bondingProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-bonding-provider">Bonding Provider</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Surety Company" 
                              data-testid="input-bonding-provider"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-bonding-provider" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bondingAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-bonding-amount">Bonding Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              placeholder="50000" 
                              data-testid="input-bonding-amount"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Amount in USD
                          </FormDescription>
                          <FormMessage data-testid="error-bonding-amount" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </div>
            )}

            {/* Step 4: Business Details & Portfolio */}
            {currentStep === 4 && (
              <div className="space-y-6" data-testid="step-details">
                <FormSection
                  title="Portfolio & Certifications"
                  description="Showcase your work and qualifications"
                >
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Portfolio Images</h4>
                      <FileUpload
                        label="Upload Portfolio Images"
                        description="Upload photos of your completed projects (up to 10 images, max 10MB each)"
                        onFileSelect={(files) => setPortfolioFiles([...portfolioFiles, ...files])}
                        onFileRemove={(index) => {
                          const newFiles = [...portfolioFiles];
                          newFiles.splice(index, 1);
                          setPortfolioFiles(newFiles);
                        }}
                        files={portfolioFiles}
                        maxFiles={10}
                        acceptedTypes={["image/*"]}
                        data-testid="portfolio-upload"
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-4">Certifications</h4>
                      <FileUpload
                        label="Upload Certification Documents"
                        description="Upload your professional certifications (up to 5 files, max 10MB each)"
                        onFileSelect={(files) => setCertificationFiles([...certificationFiles, ...files])}
                        onFileRemove={(index) => {
                          const newFiles = [...certificationFiles];
                          newFiles.splice(index, 1);
                          setCertificationFiles(newFiles);
                        }}
                        files={certificationFiles}
                        maxFiles={5}
                        acceptedTypes={["image/*", "application/pdf"]}
                        data-testid="certification-upload"
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Business Hours"
                  description="When are you available for work?"
                >
                  <BusinessHoursInput prefix="businessHours" />
                </FormSection>

                <FormSection
                  title="Service Preferences"
                  description="Additional service options you offer"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="emergencyServices"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              data-testid="checkbox-emergency-services"
                            />
                          </FormControl>
                          <FormLabel data-testid="label-emergency-services">
                            I offer emergency services
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weekendServices"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              data-testid="checkbox-weekend-services"
                            />
                          </FormControl>
                          <FormLabel data-testid="label-weekend-services">
                            I work on weekends
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
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
                    "Creating Profile..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Registration
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