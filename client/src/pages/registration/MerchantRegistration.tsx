import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MerchantProfileCreateSchema } from "@shared/types";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

import { AlertCircle, Store, Package, Clock, FileText, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

// Extended schema for merchant registration
const MerchantRegistrationSchema = MerchantProfileCreateSchema.extend({
  // File uploads
  businessImageFiles: z.array(z.any()).optional(),
  logoFile: z.array(z.any()).optional(),
  
  // Enhanced delivery options
  deliveryOptions: z.object({
    delivery: z.boolean().default(false),
    pickup: z.boolean().default(true),
    shipping: z.boolean().default(false),
    deliveryRadius: z.coerce.number().min(0, "Invalid radius").optional(),
    deliveryFee: z.coerce.number().min(0, "Invalid fee").optional(),
    freeDeliveryMinimum: z.coerce.number().min(0, "Invalid minimum").optional(),
  }).optional(),
  
  // Business policies
  policies: z.object({
    returnPolicy: z.string().max(500, "Policy too long").optional(),
    warrantyPolicy: z.string().max(500, "Policy too long").optional(),
    cancellationPolicy: z.string().max(500, "Policy too long").optional(),
  }).optional(),
});

type MerchantRegistrationForm = z.infer<typeof MerchantRegistrationSchema>;

const REGISTRATION_STEPS = [
  {
    id: "business-info",
    title: "Business Info",
    description: "Basic store details"
  },
  {
    id: "categories",
    title: "Categories & Type",
    description: "What you offer"
  },
  {
    id: "operations",
    title: "Operations",
    description: "Hours and services"
  },
  {
    id: "verification",
    title: "Verification",
    description: "Legal and branding"
  }
];

const BUSINESS_TYPES = [
  "Hardware Store",
  "Garden Center", 
  "Home Improvement",
  "Electrical Supplies",
  "Plumbing Supplies",
  "Lumber Yard",
  "Paint Store",
  "Flooring Store",
  "Appliance Store",
  "HVAC Supplies",
  "Roofing Materials",
  "Windows & Doors",
  "Kitchen & Bath",
  "Outdoor/Landscaping",
  "Tools & Equipment",
  "Safety Supplies",
  "General Retail",
  "Other"
];

const PAYMENT_METHODS = [
  { id: "cash" as const, label: "Cash" },
  { id: "check" as const, label: "Check" },
  { id: "credit" as const, label: "Credit Cards" },
  { id: "debit" as const, label: "Debit Cards" },
  { id: "digital" as const, label: "Digital Payments (PayPal, Venmo, etc.)" },
  { id: "financing" as const, label: "Financing Options" }
] as const;

export default function MerchantRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessImageFiles, setBusinessImageFiles] = useState<File[]>([]);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Note: No authentication check needed - registration creates the user account

  const form = useForm<MerchantRegistrationForm>({
    resolver: zodResolver(MerchantRegistrationSchema),
    defaultValues: {
      userId: "",
      businessName: "",
      ownerName: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      businessType: "",
      businessDescription: "",
      businessLicense: "",
      taxId: "",
      serviceArea: "",
      specialties: [],
      acceptedPaymentMethods: ["cash", "credit"],
      businessImages: [],
      logoUrl: "",
      operationsData: {
        operatingHours: {
          monday: { start: "09:00", end: "17:00", closed: false },
          tuesday: { start: "09:00", end: "17:00", closed: false },
          wednesday: { start: "09:00", end: "17:00", closed: false },
          thursday: { start: "09:00", end: "17:00", closed: false },
          friday: { start: "09:00", end: "17:00", closed: false },
          saturday: { start: "10:00", end: "16:00", closed: false },
          sunday: { start: "", end: "", closed: true },
        },
        deliveryOptions: {
          delivery: false,
          pickup: true,
          shipping: false,
          deliveryRadius: undefined,
          deliveryFee: undefined,
          freeDeliveryMinimum: undefined,
        },
        policies: {
          returnPolicy: "",
          warrantyPolicy: "",
          cancellationPolicy: "",
        }
      }
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: MerchantRegistrationForm) => {
      // Create user with merchant role
      const userResponse = await apiRequest("POST", "/api/auth/create-user", {
        role: "merchant",
        firstName: data.ownerName.split(" ")[0],
        lastName: data.ownerName.split(" ").slice(1).join(" "),
        email: data.email
      });

      const user = await userResponse.json();

      // Create merchant profile
      const profileData = {
        ...data,
        userId: user.id,
      };

      const response = await apiRequest("POST", "/api/merchants", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registration Successful!",
        description: "Your merchant profile has been created. We'll review your information and get back to you soon.",
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

  const onSubmit = (data: MerchantRegistrationForm) => {
    registerMutation.mutate(data);
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof MerchantRegistrationForm)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["businessName", "ownerName", "phone", "email", "address", "city", "state", "zipCode"];
        break;
      case 2:
        fieldsToValidate = ["businessType", "businessDescription"];
        break;
      case 3:
        // No specific required fields, but we can validate business hours if needed
        break;
      case 4:
        fieldsToValidate = ["businessLicense", "taxId"];
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
      title="Merchant Registration"
      subtitle="Join HomeHub's trusted network of local businesses"
    >
      <div className="space-y-8">
        {/* Progress Indicator */}
        <StepIndicator 
          steps={REGISTRATION_STEPS} 
          currentStep={currentStep}
          data-testid="merchant-registration-steps"
        />

        {/* Registration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-6" data-testid="step-business-info">
                <FormSection
                  title="Business Information"
                  description="Tell us about your store or business"
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
                              placeholder="ABC Hardware Store" 
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
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-owner-name">
                            Owner Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Smith" 
                              data-testid="input-owner-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-owner-name" />
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
                              placeholder="info@abchardware.com" 
                              data-testid="input-email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-email" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-website">Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.abchardware.com" 
                            data-testid="input-website"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage data-testid="error-website" />
                      </FormItem>
                    )}
                  />
                </FormSection>

                <FormSection
                  title="Business Address"
                  description="Where is your business located?"
                  required
                >
                  <AddressFields required />
                  
                  <FormField
                    control={form.control}
                    name="serviceArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-service-area">Service Area</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Downtown, Westside, or specific zip codes"
                            data-testid="input-service-area"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Areas or neighborhoods you serve (optional)
                        </FormDescription>
                        <FormMessage data-testid="error-service-area" />
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            )}

            {/* Step 2: Business Type & Categories */}
            {currentStep === 2 && (
              <div className="space-y-6" data-testid="step-categories">
                <FormSection
                  title="Business Type"
                  description="What type of business do you operate?"
                  required
                >
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-business-type">
                          Business Type <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-business-type">
                              <SelectValue placeholder="Select your business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem 
                                key={type} 
                                value={type}
                                data-testid={`business-type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage data-testid="error-business-type" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-business-description">
                          Business Description <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business, what products/services you offer, and what makes you unique..."
                            className="min-h-[120px]"
                            data-testid="input-business-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your public profile
                        </FormDescription>
                        <FormMessage data-testid="error-business-description" />
                      </FormItem>
                    )}
                  />
                </FormSection>

                <FormSection
                  title="Product & Service Categories"
                  description="What do you specialize in?"
                >
                  <SpecialtySelector
                    fieldName="specialties"
                    type="merchant"
                    maxSelections={10}
                  />
                </FormSection>

                <FormSection
                  title="Payment Methods"
                  description="What payment methods do you accept?"
                >
                  <FormField
                    control={form.control}
                    name="acceptedPaymentMethods"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-payment-methods">Accepted Payment Methods</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                          {PAYMENT_METHODS.map((method) => (
                            <div key={method.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={method.id}
                                checked={field.value?.includes(method.id as any) || false}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, method.id as any]);
                                  } else {
                                    field.onChange(current.filter(item => item !== method.id));
                                  }
                                }}
                                data-testid={`checkbox-payment-${method.id}`}
                              />
                              <label
                                htmlFor={method.id}
                                className="text-sm cursor-pointer"
                                data-testid={`label-payment-${method.id}`}
                              >
                                {method.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage data-testid="error-payment-methods" />
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            )}

            {/* Step 3: Operations & Hours */}
            {currentStep === 3 && (
              <div className="space-y-6" data-testid="step-operations">
                <FormSection
                  title="Business Hours"
                  description="When is your business open?"
                >
                  <BusinessHoursInput prefix="operationsData.operatingHours" />
                </FormSection>

                <FormSection
                  title="Delivery & Shipping Options"
                  description="How do customers receive your products/services?"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="operationsData.deliveryOptions.pickup"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-pickup"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-pickup">In-store pickup</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="operationsData.deliveryOptions.delivery"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-delivery"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-delivery">Local delivery</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="operationsData.deliveryOptions.shipping"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-shipping"
                              />
                            </FormControl>
                            <FormLabel data-testid="label-shipping">Shipping</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Delivery Options Details */}
                    {form.watch("operationsData.deliveryOptions.delivery") && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
                        <FormField
                          control={form.control}
                          name="operationsData.deliveryOptions.deliveryRadius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-delivery-radius">Delivery Radius (miles)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  placeholder="10"
                                  data-testid="input-delivery-radius"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage data-testid="error-delivery-radius" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="operationsData.deliveryOptions.deliveryFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-delivery-fee">Delivery Fee ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="5.00"
                                  data-testid="input-delivery-fee"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage data-testid="error-delivery-fee" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="operationsData.deliveryOptions.freeDeliveryMinimum"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-free-delivery-minimum">Free Delivery Minimum ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="50.00"
                                  data-testid="input-free-delivery-minimum"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage data-testid="error-free-delivery-minimum" />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </FormSection>

                <FormSection
                  title="Business Policies"
                  description="Help customers understand your policies"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="operationsData.policies.returnPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-return-policy">Return Policy</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="30-day return policy with receipt..."
                              data-testid="input-return-policy"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-return-policy" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="operationsData.policies.warrantyPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-warranty-policy">Warranty Policy</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="1-year manufacturer warranty on all products..."
                              data-testid="input-warranty-policy"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-warranty-policy" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </div>
            )}

            {/* Step 4: Verification & Assets */}
            {currentStep === 4 && (
              <div className="space-y-6" data-testid="step-verification">
                <FormSection
                  title="Business Verification"
                  description="Legal requirements for operating your business"
                  required
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-business-license">
                            Business License Number <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="BL123456789" 
                              data-testid="input-business-license"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-business-license" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-tax-id">
                            Tax ID / EIN <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="12-3456789" 
                              data-testid="input-tax-id"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage data-testid="error-tax-id" />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Business Photos & Branding"
                  description="Showcase your store and products"
                >
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Business Logo</h4>
                      <FileUpload
                        label="Upload Business Logo"
                        description="Upload your business logo (1 file, max 5MB)"
                        onFileSelect={(files) => setLogoFiles([...logoFiles, ...files])}
                        onFileRemove={(index) => {
                          const newFiles = [...logoFiles];
                          newFiles.splice(index, 1);
                          setLogoFiles(newFiles);
                        }}
                        files={logoFiles}
                        maxFiles={1}
                        acceptedTypes={["image/*"]}
                        multiple={false}
                        data-testid="logo-upload"
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-4">Store Photos</h4>
                      <FileUpload
                        label="Upload Store Photos"
                        description="Upload photos of your store, products, or services (up to 10 images, max 10MB each)"
                        onFileSelect={(files) => setBusinessImageFiles([...businessImageFiles, ...files])}
                        onFileRemove={(index) => {
                          const newFiles = [...businessImageFiles];
                          newFiles.splice(index, 1);
                          setBusinessImageFiles(newFiles);
                        }}
                        files={businessImageFiles}
                        maxFiles={10}
                        acceptedTypes={["image/*"]}
                        data-testid="business-images-upload"
                      />
                    </div>
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