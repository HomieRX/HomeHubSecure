import { z } from "zod";

// Base types from schema
export type MembershipTier = "HomeHUB" | "HomePRO" | "HomeHERO" | "HomeGURU";
export type ServiceType = "FixiT" | "PreventiT" | "HandleiT" | "CheckiT" | "LoyalizeiT";
export type ServiceCategory = "Handyman" | "Dishwasher" | "Oven" | "Microwave" | "Refrigerator" | "Sink Disposal" | "Clothes Washer" | "Clothes Dryer" | "Water Heater" | "Basic Electrical" | "Basic Irrigation" | "Basic Plumbing";
export type UrgencyLevel = "low" | "normal" | "high" | "emergency";

// Enhanced type definitions for better validation
export type UserRole = "homeowner" | "contractor" | "merchant" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted" | "pending";
export type ServiceRequestStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | "on_hold" | "requires_approval";
export type WorkOrderStatus = "created" | "in_progress" | "completed" | "cancelled";
export type EstimateStatus = "pending" | "approved" | "rejected" | "expired";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";
export type EscrowStatus = "pending" | "funded" | "released" | "disputed" | "refunded";

// Common validation patterns
const phoneRegex = /^(\+?1\s?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/; // US phone formats: (555) 123-4567, 555-123-4567, 555.123.4567, etc.
const zipCodeRegex = /^\d{5}(-\d{4})?$/;
const urlRegex = /^https?:\/\/.+\..+/;

// ======================================================================
// ZOD VALIDATION SCHEMAS - CREATE/UPDATE OPERATIONS
// ======================================================================

// User Profile Validation Schemas
export const UserProfileCreateSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().min(1, "First name required").max(50, "First name too long").optional(),
  lastName: z.string().min(1, "Last name required").max(50, "Last name too long").optional(),
  profileImageUrl: z.string().regex(urlRegex, "Invalid URL format").optional(),
  role: z.enum(["homeowner", "contractor", "merchant", "admin"]).default("homeowner"),
  // Community features stored in JSON metadata
  displayName: z.string().min(1, "Display name required").max(50, "Display name too long").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  // JSON metadata for community features
  communityData: z.object({
    friends: z.array(z.string().uuid()).optional(),
    groups: z.array(z.string().uuid()).optional(),
    badges: z.array(z.string()).optional(),
    activityLevel: z.enum(["low", "medium", "high"]).optional(),
    profileVisibility: z.enum(["public", "friends", "private"]).default("public"),
  }).optional(),
}).strict();

export const UserProfileUpdateSchema = UserProfileCreateSchema.partial();

// Member Profile Validation Schemas  
export const MemberProfileCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  nickname: z.string().min(1, "Nickname required").max(30, "Nickname too long"),
  firstName: z.string().min(1, "First name required").max(50, "First name too long").optional(),
  lastName: z.string().min(1, "Last name required").max(50, "Last name too long").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(phoneRegex, "Invalid phone number format").optional(),
  avatarUrl: z.string().regex(urlRegex, "Invalid URL format").optional(),
  coverImageUrl: z.string().regex(urlRegex, "Invalid URL format").optional(),
  membershipTier: z.enum(["HomeHUB", "HomePRO", "HomeHERO", "HomeGURU"]).default("HomeHUB"),
  // Billing and payment fields
  membershipStatus: z.enum(["free", "pending_payment", "active", "past_due", "canceled"]).default("free"),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripePriceId: z.string().optional(),
  currentPeriodEnd: z.date().optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  
  // Primary address
  address: z.string().min(1, "Address required").max(200, "Address too long"),
  city: z.string().min(1, "City required").max(100, "City too long"),
  state: z.string().min(2, "State required").max(50, "State too long"),
  zipCode: z.string().regex(zipCodeRegex, "Invalid ZIP code format"),
  
  // Additional member details stored in JSON
  personalDetails: z.object({
    // Multiple addresses
    secondaryAddresses: z.array(z.object({
      type: z.enum(["vacation", "rental", "work", "other"]),
      address: z.string().min(1, "Address required"),
      city: z.string().min(1, "City required"),
      state: z.string().min(2, "State required"),
      zipCode: z.string().regex(zipCodeRegex, "Invalid ZIP code"),
    })).optional(),
    
    // Emergency contacts
    emergencyContacts: z.array(z.object({
      name: z.string().min(1, "Name required"),
      relationship: z.string().min(1, "Relationship required"),
      phone: z.string().regex(phoneRegex, "Invalid phone number"),
      email: z.string().email("Invalid email").optional(),
    })).optional(),
    
    // Communication preferences
    preferredCommunication: z.enum(["email", "text", "call"]).default("email"),
    communicationTimes: z.object({
      weekdays: z.object({ start: z.string(), end: z.string() }).optional(),
      weekends: z.object({ start: z.string(), end: z.string() }).optional(),
    }).optional(),
  }).optional(),
  
  // Home data
  homeData: z.object({
    homeType: z.enum(["single-family", "condo", "townhouse", "apartment", "duplex", "mobile", "other"]).optional(),
    yearBuilt: z.number().min(1800, "Invalid year").max(new Date().getFullYear(), "Invalid year").optional(),
    squareFootage: z.number().min(100, "Invalid square footage").max(50000, "Invalid square footage").optional(),
    bedrooms: z.number().min(0, "Invalid bedroom count").max(20, "Invalid bedroom count").optional(),
    bathrooms: z.number().min(0, "Invalid bathroom count").max(20, "Invalid bathroom count").optional(),
    lotSize: z.string().max(50, "Lot size description too long").optional(),
    
    // Utilities and systems
    utilities: z.object({
      waterSource: z.enum(["city", "well", "other"]).optional(),
      powerType: z.enum(["electric", "gas", "solar", "mixed"]).optional(),
      gasType: z.enum(["natural", "propane", "none"]).optional(),
      sewerType: z.enum(["city", "septic", "other"]).optional(),
    }).optional(),
    
    systems: z.object({
      hvacType: z.enum(["central", "window", "split", "geothermal", "radiant"]).optional(),
      heatingType: z.enum(["gas", "electric", "oil", "heat-pump", "wood", "solar"]).optional(),
      coolingType: z.enum(["central-air", "window-units", "evaporative", "none"]).optional(),
      irrigationType: z.enum(["sprinkler", "drip", "manual", "none"]).optional(),
      securitySystem: z.boolean().optional(),
      smartHome: z.boolean().optional(),
    }).optional(),
    
    // Appliances and features
    appliances: z.array(z.object({
      type: z.string().min(1, "Appliance type required"),
      brand: z.string().optional(),
      model: z.string().optional(),
      age: z.number().min(0, "Invalid age").optional(),
      warrantyExpires: z.string().optional(),
    })).optional(),
    
    specialFeatures: z.array(z.string()).optional(),
    accessInstructions: z.string().max(500, "Instructions too long").optional(),
  }).optional(),
}).strict();

export const MemberProfileUpdateSchema = MemberProfileCreateSchema.partial().omit({ userId: true });

// Contractor Profile Validation Schemas
export const ContractorProfileCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  businessName: z.string().min(1, "Business name required").max(100, "Business name too long"),
  firstName: z.string().min(1, "First name required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name required").max(50, "Last name too long"),
  phone: z.string().regex(phoneRegex, "Invalid phone number format"),
  email: z.string().email("Invalid email format"),
  
  // Business address
  address: z.string().min(1, "Address required").max(200, "Address too long"),
  city: z.string().min(1, "City required").max(100, "City too long"),
  state: z.string().min(2, "State required").max(50, "State too long"),
  zipCode: z.string().regex(zipCodeRegex, "Invalid ZIP code format"),
  
  serviceRadius: z.number().min(1, "Service radius must be at least 1 mile").max(200, "Service radius too large").default(25),
  hourlyRate: z.number().min(25, "Hourly rate too low").max(500, "Hourly rate too high").optional(),
  
  // License and insurance
  licenseNumber: z.string().min(1, "License number required").max(50, "License number too long"),
  licenseType: z.string().min(1, "License type required").max(100, "License type too long"),
  licenseExpiryDate: z.string().refine((date) => new Date(date) > new Date(), "License must not be expired"),
  insuranceProvider: z.string().min(1, "Insurance provider required").max(100, "Provider name too long"),
  insurancePolicyNumber: z.string().min(1, "Policy number required").max(50, "Policy number too long"),
  insuranceExpiryDate: z.string().refine((date) => new Date(date) > new Date(), "Insurance must not be expired"),
  bondingProvider: z.string().max(100, "Provider name too long").optional(),
  bondingAmount: z.number().min(0, "Invalid bonding amount").optional(),
  
  bio: z.string().max(1000, "Bio too long").optional(),
  specialties: z.array(z.string().min(1, "Specialty required")).min(1, "At least one specialty required").optional(),
  certifications: z.array(z.string().min(1, "Certification required")).optional(),
  yearsExperience: z.number().min(0, "Invalid experience").max(50, "Invalid experience").optional(),
  portfolioImages: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  
  // Professional details stored in JSON
  businessDetails: z.object({
    website: z.string().regex(urlRegex, "Invalid website URL").optional(),
    socialMedia: z.object({
      facebook: z.string().regex(urlRegex, "Invalid URL").optional(),
      instagram: z.string().regex(urlRegex, "Invalid URL").optional(),
      linkedin: z.string().regex(urlRegex, "Invalid URL").optional(),
      youtube: z.string().regex(urlRegex, "Invalid URL").optional(),
    }).optional(),
    
    businessHours: z.object({
      monday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      tuesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      wednesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      thursday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      friday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      saturday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      sunday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    }).optional(),
    
    serviceAreas: z.array(z.string()).optional(),
    paymentMethods: z.array(z.enum(["cash", "check", "credit", "debit", "financing", "venmo", "paypal"])).optional(),
    emergencyServices: z.boolean().default(false),
    weekendServices: z.boolean().default(false),
  }).optional(),
  
  // Performance tracking
  performanceMetrics: z.object({
    responseTimeHours: z.number().min(0, "Invalid response time").optional(),
    completionRate: z.number().min(0, "Invalid rate").max(100, "Invalid rate").optional(),
    customerSatisfaction: z.number().min(0, "Invalid rating").max(5, "Invalid rating").optional(),
    repeatCustomerRate: z.number().min(0, "Invalid rate").max(100, "Invalid rate").optional(),
  }).optional(),
}).strict();

export const ContractorProfileUpdateSchema = ContractorProfileCreateSchema.partial().omit({ userId: true });

// Merchant Profile Validation Schemas
export const MerchantProfileCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  businessName: z.string().min(1, "Business name required").max(100, "Business name too long"),
  ownerName: z.string().min(1, "Owner name required").max(100, "Owner name too long"),
  phone: z.string().regex(phoneRegex, "Invalid phone number format"),
  email: z.string().email("Invalid email format"),
  website: z.string().regex(urlRegex, "Invalid website URL").optional(),
  
  // Business address
  address: z.string().min(1, "Address required").max(200, "Address too long"),
  city: z.string().min(1, "City required").max(100, "City too long"),
  state: z.string().min(2, "State required").max(50, "State too long"),
  zipCode: z.string().regex(zipCodeRegex, "Invalid ZIP code format"),
  
  businessType: z.string().min(1, "Business type required").max(100, "Business type too long"),
  businessDescription: z.string().min(1, "Description required").max(1000, "Description too long"),
  businessLicense: z.string().min(1, "License required").max(50, "License too long"),
  taxId: z.string().min(1, "Tax ID required").max(20, "Tax ID too long"),
  serviceArea: z.string().max(200, "Service area description too long").optional(),
  specialties: z.array(z.string().min(1, "Specialty required")).optional(),
  acceptedPaymentMethods: z.array(z.enum(["cash", "check", "credit", "debit", "digital", "financing"])).optional(),
  businessImages: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  logoUrl: z.string().regex(urlRegex, "Invalid logo URL").optional(),
  
  // Business operations stored in JSON
  operationsData: z.object({
    operatingHours: z.object({
      monday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      tuesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      wednesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      thursday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      friday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      saturday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
      sunday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    }).optional(),
    
    socialMedia: z.object({
      facebook: z.string().regex(urlRegex, "Invalid URL").optional(),
      instagram: z.string().regex(urlRegex, "Invalid URL").optional(),
      twitter: z.string().regex(urlRegex, "Invalid URL").optional(),
      youtube: z.string().regex(urlRegex, "Invalid URL").optional(),
      yelp: z.string().regex(urlRegex, "Invalid URL").optional(),
    }).optional(),
    
    deliveryOptions: z.object({
      delivery: z.boolean().default(false),
      pickup: z.boolean().default(true),
      shipping: z.boolean().default(false),
      deliveryRadius: z.number().min(0, "Invalid radius").optional(),
      deliveryFee: z.number().min(0, "Invalid fee").optional(),
      freeDeliveryMinimum: z.number().min(0, "Invalid minimum").optional(),
    }).optional(),
    
    policies: z.object({
      returnPolicy: z.string().max(500, "Policy too long").optional(),
      warrantyPolicy: z.string().max(500, "Policy too long").optional(),
      cancellationPolicy: z.string().max(500, "Policy too long").optional(),
    }).optional(),
  }).optional(),
  
  // Engagement metrics stored in JSON
  engagementData: z.object({
    totalViews: z.number().min(0, "Invalid view count").default(0),
    totalClicks: z.number().min(0, "Invalid click count").default(0),
    totalRedemptions: z.number().min(0, "Invalid redemption count").default(0),
    averageRating: z.number().min(0, "Invalid rating").max(5, "Invalid rating").default(0),
    totalReviews: z.number().min(0, "Invalid review count").default(0),
    partnershipStartDate: z.string().optional(),
    contractStatus: z.enum(["active", "pending", "suspended", "terminated"]).default("pending"),
  }).optional(),
}).strict();

export const MerchantProfileUpdateSchema = MerchantProfileCreateSchema.partial().omit({ userId: true });

// User and Profile Types (for responses)
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  membershipTier: MembershipTier;
  loyaltyPoints: number;
  bio?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  homeManagerId?: string;
  joinedAt: string;
  updatedAt: string;
}

// Service Configuration Types
export interface ServiceConfig {
  name: string;
  description: string;
  billingModel: "hourly" | "session" | "project" | "points";
  features: string[];
  defaultSlotDuration: number;
  pointsReward: number;
  baseRate?: number;
  requiresApproval: boolean;
  maxBookingsPerDay?: number;
  categories: ServiceCategory[];
}

export interface ServiceTypeDefinition {
  type: ServiceType;
  config: ServiceConfig;
  membershipTiers: MembershipTier[];
  isActive: boolean;
}

// Service Availability
export interface ServiceAvailability {
  serviceType: ServiceType;
  isAvailable: boolean;
  seasonalRestrictions?: string[];
  maintenanceMode: boolean;
  availableSlots?: string[];
}

// Membership Benefits
export interface MembershipBenefits {
  [key: string]: {
    services: ServiceType[];
    discountPercentage: number;
    pointsMultiplier: number;
    prioritySupport: boolean;
    exclusiveFeatures: string[];
    monthlyCredits?: number;
  };
}

// API Response Types
export interface AuthUserResponse {
  user: User & {
    memberProfile?: MemberProfile;
  };
}

export interface ServiceTypesResponse {
  serviceTypes: ServiceTypeDefinition[];
}

export interface ServiceAvailabilityResponse {
  availability: ServiceAvailability[];
}

export interface MembershipBenefitsResponse {
  benefits: MembershipBenefits;
}

export interface AvailableServicesResponse {
  services: ServiceTypeDefinition[];
  membershipTier: MembershipTier;
}

// Service Request Types
export interface ServiceRequest {
  id: string;
  memberId: string;
  serviceType: ServiceType;
  category: ServiceCategory;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  preferredDateTime?: string;
  isSeasonalService: boolean;
  seasonalWindow?: string;
  slotDuration?: number;
  requiredSkills?: string[];
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | "on_hold" | "requires_approval";
  homeManagerId?: string;
  assignedContractorId?: string;
  assignedAt?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  finalCost?: number;
  requiresEscrow: boolean;
  escrowAmount?: number;
  escrowStatus?: "pending" | "funded" | "released" | "disputed" | "refunded";
  pointsReward: number;
  membershipBenefitApplied: boolean;
  loyaltyDiscountApplied: number;
  images?: string[];
  memberNotes?: string;
  internalNotes?: string;
  completionNotes?: string;
  serviceMetadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestData {
  serviceType: ServiceType;
  category: ServiceCategory;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  preferredDateTime?: Date;
  estimatedDuration: number;
  memberNotes?: string;
  memberId: string;
}

export interface ServiceRequestResponse {
  serviceRequest: ServiceRequest;
  success: boolean;
  message: string;
}

export interface ServiceRequestsResponse {
  requests: ServiceRequest[];
  total: number;
  success: boolean;
  message: string;
}

// ======================================================================
// ADDITIONAL ENTITY VALIDATION SCHEMAS
// ======================================================================

// Service Request Validation Schemas
export const ServiceRequestCreateSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  serviceType: z.enum(["FixiT", "PreventiT", "HandleiT", "CheckiT", "LoyalizeiT"]),
  category: z.enum(["Handyman", "Dishwasher", "Oven", "Microwave", "Refrigerator", "Sink Disposal", "Clothes Washer", "Clothes Dryer", "Water Heater", "Basic Electrical", "Basic Irrigation", "Basic Plumbing"]),
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  urgency: z.enum(["low", "normal", "high", "emergency"]).default("normal"),
  
  // Location
  address: z.string().min(1, "Address required").max(200, "Address too long"),
  city: z.string().min(1, "City required").max(100, "City too long"),
  state: z.string().min(2, "State required").max(50, "State too long"),
  zipCode: z.string().regex(zipCodeRegex, "Invalid ZIP code format"),
  
  // Timing
  preferredDateTime: z.string().optional(),
  estimatedDuration: z.number().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours").optional(),
  
  // Optional fields
  requiredSkills: z.array(z.string()).optional(),
  memberNotes: z.string().max(1000, "Notes too long").optional(),
  images: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  attachments: z.array(z.string().regex(urlRegex, "Invalid attachment URL")).optional(),
  
  // Service-specific metadata
  serviceMetadata: z.record(z.any()).optional(),
}).strict();

export const ServiceRequestUpdateSchema = ServiceRequestCreateSchema.partial().omit({ memberId: true });

// Work Order Validation Schemas
export const WorkOrderCreateSchema = z.object({
  serviceRequestId: z.string().uuid("Invalid service request ID"),
  homeManagerId: z.string().uuid("Invalid home manager ID"),
  contractorId: z.string().uuid("Invalid contractor ID").optional(),
  workOrderNumber: z.string().min(1, "Work order number required").max(50, "Work order number too long"),
  workDescription: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  
  // Scheduling
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  
  // Materials and labor
  materialsNeeded: z.array(z.object({
    item: z.string().min(1, "Item name required"),
    quantity: z.number().min(1, "Quantity required"),
    estimatedCost: z.number().min(0, "Invalid cost").optional(),
  })).optional(),
  
  laborHours: z.number().min(0, "Invalid labor hours").max(40, "Maximum 40 hours").optional(),
  workNotes: z.string().max(1000, "Notes too long").optional(),
  
  // Documentation
  beforeImages: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  afterImages: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  attachments: z.array(z.string().regex(urlRegex, "Invalid attachment URL")).optional(),
}).strict();

export const WorkOrderUpdateSchema = WorkOrderCreateSchema.partial().omit({ serviceRequestId: true, homeManagerId: true });

// Estimate Validation Schemas
export const EstimateCreateSchema = z.object({
  serviceRequestId: z.string().uuid("Invalid service request ID"),
  contractorId: z.string().uuid("Invalid contractor ID"),
  estimateNumber: z.string().min(1, "Estimate number required").max(50, "Estimate number too long"),
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  
  // Costs
  laborCost: z.number().min(0, "Invalid labor cost"),
  materialCost: z.number().min(0, "Invalid material cost"),
  additionalCosts: z.number().min(0, "Invalid additional costs").default(0),
  totalCost: z.number().min(0, "Invalid total cost"),
  
  // Timeline
  estimatedHours: z.number().min(0.5, "Minimum 0.5 hours").max(200, "Maximum 200 hours").optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  validUntil: z.string().refine((date) => new Date(date) > new Date(), "Valid until date must be in the future"),
  
  // Detailed breakdown
  materials: z.array(z.object({
    item: z.string().min(1, "Item name required"),
    quantity: z.number().min(1, "Quantity required"),
    unitCost: z.number().min(0, "Invalid unit cost"),
    totalCost: z.number().min(0, "Invalid total cost"),
  })).optional(),
  
  laborBreakdown: z.array(z.object({
    task: z.string().min(1, "Task description required"),
    hours: z.number().min(0, "Invalid hours"),
    rate: z.number().min(0, "Invalid rate"),
    cost: z.number().min(0, "Invalid cost"),
  })).optional(),
  
  terms: z.string().max(2000, "Terms too long").optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
  attachments: z.array(z.string().regex(urlRegex, "Invalid attachment URL")).optional(),
}).strict();

export const EstimateUpdateSchema = EstimateCreateSchema.partial().omit({ serviceRequestId: true, contractorId: true });

// Invoice Validation Schemas
export const InvoiceCreateSchema = z.object({
  workOrderId: z.string().uuid("Invalid work order ID"),
  memberId: z.string().uuid("Invalid member ID"),
  invoiceNumber: z.string().min(1, "Invoice number required").max(50, "Invoice number too long"),
  
  // Financial details
  subtotal: z.number().min(0, "Invalid subtotal"),
  tax: z.number().min(0, "Invalid tax amount").default(0),
  total: z.number().min(0, "Invalid total"),
  amountDue: z.number().min(0, "Invalid amount due"),
  
  // Loyalty points
  loyaltyPointsUsed: z.number().min(0, "Invalid points used").default(0),
  loyaltyPointsValue: z.number().min(0, "Invalid points value").default(0),
  loyaltyPointsEarned: z.number().min(0, "Invalid points earned").default(0),
  
  // Payment details
  dueDate: z.string().refine((date) => new Date(date) >= new Date(), "Due date cannot be in the past"),
  paymentMethod: z.enum(["cash", "check", "credit", "debit", "ach", "financing"]).optional(),
  paymentTransactionId: z.string().max(100, "Transaction ID too long").optional(),
  
  // Line items
  lineItems: z.array(z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.number().min(1, "Quantity required"),
    unitPrice: z.number().min(0, "Invalid unit price"),
    totalPrice: z.number().min(0, "Invalid total price"),
    category: z.enum(["labor", "materials", "permit", "disposal", "travel", "other"]).default("other"),
  })).min(1, "At least one line item required"),
  
  notes: z.string().max(1000, "Notes too long").optional(),
}).strict();

export const InvoiceUpdateSchema = InvoiceCreateSchema.partial().omit({ workOrderId: true, memberId: true });

// Message Validation Schemas  
export const MessageCreateSchema = z.object({
  senderId: z.string().uuid("Invalid sender ID"),
  receiverId: z.string().uuid("Invalid receiver ID"),
  subject: z.string().min(1, "Subject required").max(200, "Subject too long").optional(),
  content: z.string().min(1, "Message content required").max(5000, "Message too long"),
  
  // Message organization
  threadId: z.string().uuid("Invalid thread ID").optional(),
  messageType: z.enum(["general", "service_related", "system", "notification"]).default("general"),
  
  // Related entities
  relatedEntityId: z.string().uuid("Invalid entity ID").optional(),
  relatedEntityType: z.enum(["service_request", "work_order", "estimate", "invoice", "deal"]).optional(),
  
  // Attachments
  attachments: z.array(z.object({
    filename: z.string().min(1, "Filename required"),
    url: z.string().regex(urlRegex, "Invalid file URL"),
    fileType: z.string().min(1, "File type required"),
    fileSize: z.number().min(1, "Invalid file size"),
  })).optional(),
}).strict();

export const MessageUpdateSchema = z.object({
  isRead: z.boolean().optional(),
}).strict();

// Calendar Event Validation Schemas
export const CalendarEventCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  
  // Timing
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start time"),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end time").optional(),
  
  // Event details
  eventType: z.enum(["service_appointment", "inspection", "meeting", "reminder", "maintenance", "personal"]),
  location: z.string().max(200, "Location too long").optional(),
  
  // Participants
  attendees: z.array(z.object({
    userId: z.string().uuid("Invalid user ID"),
    name: z.string().min(1, "Name required"),
    email: z.string().email("Invalid email"),
    role: z.enum(["organizer", "required", "optional"]).default("optional"),
  })).optional(),
  
  // Reminders and recurrence
  reminderMinutes: z.number().min(0, "Invalid reminder time").max(10080, "Maximum 1 week").default(15),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  
  // Related entities
  relatedEntityId: z.string().uuid("Invalid entity ID").optional(),
  relatedEntityType: z.enum(["service_request", "work_order", "estimate"]).optional(),
  
  // Additional metadata
  metadata: z.record(z.any()).optional(),
}).strict().refine((data) => {
  if (data.endTime) {
    return new Date(data.endTime) > new Date(data.startTime);
  }
  return true;
}, "End time must be after start time");

export const CalendarEventUpdateSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long").optional(),
  description: z.string().max(2000, "Description too long").optional(),
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start time").optional(),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end time").optional(),
  eventType: z.enum(["service_appointment", "inspection", "meeting", "reminder", "maintenance", "personal"]).optional(),
  location: z.string().max(200, "Location too long").optional(),
  attendees: z.array(z.object({
    userId: z.string().uuid("Invalid user ID"),
    name: z.string().min(1, "Name required"),
    email: z.string().email("Invalid email"),
    role: z.enum(["organizer", "required", "optional"]).default("optional"),
  })).optional(),
  reminderMinutes: z.number().min(0, "Invalid reminder time").max(10080, "Maximum 1 week").optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  relatedEntityId: z.string().uuid("Invalid entity ID").optional(),
  relatedEntityType: z.enum(["service_request", "work_order", "estimate"]).optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

// Deal & Offer Validation Schemas
export const DealCreateSchema = z.object({
  merchantId: z.string().uuid("Invalid merchant ID"),
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  category: z.string().min(1, "Category required").max(100, "Category too long"),
  
  // Discount details
  discountType: z.enum(["percentage", "fixed", "bogo", "free_shipping"]),
  discountValue: z.number().min(0, "Invalid discount value"),
  originalPrice: z.number().min(0, "Invalid original price").optional(),
  finalPrice: z.number().min(0, "Invalid final price").optional(),
  
  // Validity
  validFrom: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  validUntil: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  
  // Restrictions
  isExclusive: z.boolean().default(false),
  membershipRequired: z.enum(["HomeHUB", "HomePRO", "HomeHERO", "HomeGURU"]).optional(),
  maxUses: z.number().min(1, "Maximum uses must be at least 1").optional(),
  
  // Marketing
  tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
  images: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  termsAndConditions: z.string().min(1, "Terms and conditions required").max(2000, "Terms too long"),
}).strict().refine((data) => {
  return new Date(data.validUntil) > new Date(data.validFrom);
}, "Valid until date must be after valid from date");

export const DealUpdateSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long").optional(),
  category: z.string().min(1, "Category required").max(100, "Category too long").optional(),
  discountType: z.enum(["percentage", "fixed", "bogo", "free_shipping"]).optional(),
  discountValue: z.number().min(0, "Invalid discount value").optional(),
  originalPrice: z.number().min(0, "Invalid original price").optional(),
  finalPrice: z.number().min(0, "Invalid final price").optional(),
  validFrom: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date").optional(),
  validUntil: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date").optional(),
  isExclusive: z.boolean().optional(),
  membershipRequired: z.enum(["HomeHUB", "HomePRO", "HomeHERO", "HomeGURU"]).optional(),
  maxUses: z.number().min(1, "Maximum uses must be at least 1").optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
  images: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  termsAndConditions: z.string().min(1, "Terms and conditions required").max(2000, "Terms too long").optional(),
}).strict();

// ======================================================================
// FORUM SYSTEM VALIDATION SCHEMAS
// ======================================================================

// Forum Validation Schemas
export const ForumCreateSchema = z.object({
  name: z.string().min(1, "Forum name required").max(100, "Name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  forumType: z.enum(["general", "qa", "announcements", "help", "showcase", "group"]).default("general"),
  moderation: z.enum(["open", "moderated", "restricted", "locked"]).default("open"),
  
  // Optional connection to community groups
  communityGroupId: z.string().uuid("Invalid community group ID").optional(),
  
  // Organization and display
  displayOrder: z.number().min(0, "Invalid display order").default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
  icon: z.string().min(1, "Icon required").max(50, "Icon name too long").optional(),
  coverImage: z.string().regex(urlRegex, "Invalid image URL").optional(),
  
  // Access control
  isPrivate: z.boolean().default(false),
  membershipRequired: z.enum(["HomeHUB", "HomePRO", "HomeHERO", "HomeGURU"]).optional(),
  requiredRoles: z.array(z.enum(["homeowner", "contractor", "merchant", "admin"])).optional(),
  
  // Moderation
  moderatorIds: z.array(z.string().uuid("Invalid moderator ID")).optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(30, "Tag too long")).optional(),
  rules: z.string().max(2000, "Rules too long").optional(),
}).strict();

export const ForumUpdateSchema = ForumCreateSchema.partial();

// Forum Topic Validation Schemas
export const ForumTopicCreateSchema = z.object({
  forumId: z.string().uuid("Invalid forum ID"),
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  slug: z.string().min(1, "Slug required").max(250, "Slug too long").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  
  // Initial post content (required for topic creation)
  initialPostContent: z.string().min(10, "Initial post must be at least 10 characters").max(10000, "Initial post too long"),
  
  // Q&A specific
  bountyPoints: z.number().min(0, "Invalid bounty points").max(1000, "Maximum 1000 bounty points").default(0),
  
  // Tags and categorization
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(30, "Tag too long")).optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
}).strict();

export const ForumTopicUpdateSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  slug: z.string().min(1, "Slug required").max(250, "Slug too long").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  status: z.enum(["active", "locked", "pinned", "solved", "closed", "archived"]).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  isSolved: z.boolean().optional(),
  acceptedAnswerId: z.string().uuid("Invalid answer ID").optional(),
  bountyPoints: z.number().min(0, "Invalid bounty points").max(1000, "Maximum 1000 bounty points").optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(30, "Tag too long")).optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

// Forum Post Validation Schemas
export const ForumPostCreateSchema = z.object({
  topicId: z.string().uuid("Invalid topic ID"),
  forumId: z.string().uuid("Invalid forum ID"),
  parentPostId: z.string().uuid("Invalid parent post ID").optional(),
  postType: z.enum(["initial", "reply", "answer", "comment"]).default("reply"),
  
  // Content
  content: z.string().min(1, "Content required").max(10000, "Content too long"),
  attachments: z.array(z.string().regex(urlRegex, "Invalid attachment URL")).optional(),
  images: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
}).strict();

export const ForumPostUpdateSchema = z.object({
  content: z.string().min(1, "Content required").max(10000, "Content too long").optional(),
  attachments: z.array(z.string().regex(urlRegex, "Invalid attachment URL")).optional(),
  images: z.array(z.string().regex(urlRegex, "Invalid image URL")).optional(),
  status: z.enum(["active", "pending", "approved", "flagged", "hidden", "deleted"]).optional(),
  editReason: z.string().max(200, "Edit reason too long").optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

// Forum Vote Validation Schemas
export const ForumVoteCreateSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  voteType: z.enum(["up", "down"]),
}).strict();

// Moderation Schemas
export const ForumModerationSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  status: z.enum(["active", "pending", "approved", "flagged", "hidden", "deleted"]),
  moderatorReason: z.string().min(1, "Moderator reason required").max(500, "Reason too long").optional(),
}).strict();

export const ForumFlagSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  reason: z.enum(["spam", "inappropriate", "harassment", "offtopic", "duplicate", "other"]),
  description: z.string().max(500, "Description too long").optional(),
}).strict();

// ======================================================================
// SCHEDULING SYSTEM VALIDATION SCHEMAS
// ======================================================================

// Scheduling-related types
export type SlotType = "standard" | "emergency" | "inspection" | "consultation" | "followup";
export type SlotDuration = "1_hour" | "2_hour" | "4_hour" | "8_hour" | "custom";
export type ConflictSeverity = "hard" | "soft" | "travel";

// Contractor Availability Request Schema
export const ContractorAvailabilityRequestSchema = z.object({
  contractorId: z.string().uuid("Invalid contractor ID"),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  slotDuration: z.enum(["1_hour", "2_hour", "4_hour", "8_hour", "custom"]).default("2_hour"),
  slotType: z.enum(["standard", "emergency", "inspection", "consultation", "followup"]).default("standard"),
  timezone: z.string().max(50, "Timezone string too long").optional(),
}).strict().refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

// Scheduling Conflict Check Schema
export const ScheduleConflictCheckSchema = z.object({
  contractorId: z.string().uuid("Invalid contractor ID"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
}).strict().refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

// Member Preferred Dates Schema (max 3 dates)
export const MemberPreferredDatesSchema = z.array(
  z.string().datetime("Invalid date format")
).max(3, "Maximum 3 preferred dates allowed").optional();

// Time Slot Booking Request Schema
export const SlotBookingRequestSchema = z.object({
  contractorId: z.string().uuid("Invalid contractor ID"),
  workOrderId: z.string().min(1, "Work order ID required"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  slotType: z.enum(["standard", "emergency", "inspection", "consultation", "followup"]).default("standard"),
  memberPreferredDates: MemberPreferredDatesSchema,
}).strict().refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

// Scheduled Work Order Creation Schema
export const ScheduledWorkOrderCreateSchema = z.object({
  // Standard work order fields
  serviceRequestId: z.string().uuid("Invalid service request ID"),
  contractorId: z.string().uuid("Invalid contractor ID"),
  description: z.string().min(1, "Description required").max(2000, "Description too long"),
  estimatedDuration: z.number().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours").optional(),
  actualDuration: z.number().min(1, "Invalid duration").optional(),
  status: z.enum(["created", "in_progress", "completed", "cancelled"]).default("created"),
  completionNotes: z.string().max(2000, "Completion notes too long").optional(),
  
  // Scheduling fields
  scheduledStartDate: z.string().datetime("Invalid scheduled start date format"),
  scheduledEndDate: z.string().datetime("Invalid scheduled end date format"),
  slotType: z.enum(["standard", "emergency", "inspection", "consultation", "followup"]).default("standard"),
  memberPreferredDates: MemberPreferredDatesSchema,
  
  // Admin override fields
  adminOverride: z.boolean().default(false),
  overrideReason: z.string().min(1, "Override reason required").max(500, "Override reason too long").optional(),
}).strict().refine(
  (data) => new Date(data.scheduledEndDate) > new Date(data.scheduledStartDate),
  {
    message: "Scheduled end date must be after start date",
    path: ["scheduledEndDate"]
  }
).refine(
  (data) => !data.adminOverride || (data.adminOverride && data.overrideReason),
  {
    message: "Override reason is required when admin override is enabled",
    path: ["overrideReason"]
  }
);

// Admin Schedule Override Request Schema
export const AdminScheduleOverrideRequestSchema = z.object({
  contractorId: z.string().uuid("Invalid contractor ID"),
  workOrderId: z.string().uuid("Invalid work order ID"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  overrideReason: z.string().min(1, "Override reason required").max(500, "Override reason too long"),
}).strict().refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

// Time Slot Create Schema
export const TimeSlotCreateSchema = z.object({
  contractorId: z.string().uuid("Invalid contractor ID"),
  slotDate: z.string().datetime("Invalid slot date format"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  slotType: z.enum(["standard", "emergency", "inspection", "consultation", "followup"]).default("standard"),
  slotDuration: z.enum(["1_hour", "2_hour", "4_hour", "8_hour", "custom"]).default("2_hour"),
  isBooked: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  blockReason: z.string().max(200, "Block reason too long").optional(),
  workOrderId: z.string().uuid("Invalid work order ID").optional(),
}).strict().refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

export const TimeSlotUpdateSchema = z.object({
  slotDate: z.string().datetime("Invalid slot date format").optional(),
  startTime: z.string().datetime("Invalid start time format").optional(),
  endTime: z.string().datetime("Invalid end time format").optional(),
  slotType: z.enum(["standard", "emergency", "inspection", "consultation", "followup"]).optional(),
  slotDuration: z.enum(["1_hour", "2_hour", "4_hour", "8_hour", "custom"]).optional(),
  isBooked: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().max(200, "Block reason too long").optional(),
  workOrderId: z.string().uuid("Invalid work order ID").optional(),
}).strict();

// Schedule Conflict Create Schema
export const ScheduleConflictCreateSchema = z.object({
  contractorId: z.string().uuid("Invalid contractor ID"),
  workOrderId: z.string().uuid("Invalid work order ID"),
  conflictType: z.enum(["time_overlap", "double_booking", "travel_time", "availability"]),
  severity: z.enum(["hard", "soft", "travel"]).default("hard"),
  conflictDescription: z.string().min(1, "Conflict description required").max(500, "Description too long"),
  conflictingTimeStart: z.string().datetime("Invalid conflict start time format"),
  conflictingTimeEnd: z.string().datetime("Invalid conflict end time format"),
  conflictingEntityId: z.string().min(1, "Conflicting entity ID required").optional(),
  conflictingEntityType: z.enum(["work_order", "time_slot", "blocked_time", "working_hours"]).optional(),
}).strict().refine(
  (data) => new Date(data.conflictingTimeEnd) > new Date(data.conflictingTimeStart),
  {
    message: "Conflict end time must be after start time",
    path: ["conflictingTimeEnd"]
  }
);

// Schedule Conflict Resolution Schema
export const ScheduleConflictResolutionSchema = z.object({
  resolutionNotes: z.string().min(1, "Resolution notes required").max(1000, "Resolution notes too long"),
}).strict();

// Schedule Audit Log Create Schema
export const ScheduleAuditLogCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  action: z.enum(["slot_generated", "slot_booked", "slot_cancelled", "conflict_detected", "conflict_resolved", "admin_override", "schedule_updated"]),
  entityType: z.enum(["work_order", "time_slot", "schedule_conflict", "contractor_profile"]),
  entityId: z.string().min(1, "Entity ID required"),
  oldData: z.record(z.any()).optional(),
  newData: z.record(z.any()).optional(),
  userRole: z.enum(["homeowner", "contractor", "merchant", "admin"]),
  reason: z.string().max(500, "Reason too long").optional(),
  adminOverride: z.boolean().default(false),
  additionalData: z.record(z.any()).optional(),
}).strict();

// ======================================================================
// DERIVED TYPES FROM SCHEMAS
// ======================================================================

export type UserProfileCreate = z.infer<typeof UserProfileCreateSchema>;
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
export type MemberProfileCreate = z.infer<typeof MemberProfileCreateSchema>;
export type MemberProfileUpdate = z.infer<typeof MemberProfileUpdateSchema>;
export type ContractorProfileCreate = z.infer<typeof ContractorProfileCreateSchema>;
export type ContractorProfileUpdate = z.infer<typeof ContractorProfileUpdateSchema>;
export type MerchantProfileCreate = z.infer<typeof MerchantProfileCreateSchema>;
export type MerchantProfileUpdate = z.infer<typeof MerchantProfileUpdateSchema>;
export type ServiceRequestCreate = z.infer<typeof ServiceRequestCreateSchema>;
export type ServiceRequestUpdate = z.infer<typeof ServiceRequestUpdateSchema>;
export type WorkOrderCreate = z.infer<typeof WorkOrderCreateSchema>;
export type WorkOrderUpdate = z.infer<typeof WorkOrderUpdateSchema>;
export type EstimateCreate = z.infer<typeof EstimateCreateSchema>;
export type EstimateUpdate = z.infer<typeof EstimateUpdateSchema>;
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
export type InvoiceUpdate = z.infer<typeof InvoiceUpdateSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MessageUpdate = z.infer<typeof MessageUpdateSchema>;
export type CalendarEventCreate = z.infer<typeof CalendarEventCreateSchema>;
export type CalendarEventUpdate = z.infer<typeof CalendarEventUpdateSchema>;
export type DealCreate = z.infer<typeof DealCreateSchema>;
export type DealUpdate = z.infer<typeof DealUpdateSchema>;

// Scheduling system derived types
export type ContractorAvailabilityRequest = z.infer<typeof ContractorAvailabilityRequestSchema>;
export type ScheduleConflictCheck = z.infer<typeof ScheduleConflictCheckSchema>;
export type MemberPreferredDates = z.infer<typeof MemberPreferredDatesSchema>;
export type SlotBookingRequest = z.infer<typeof SlotBookingRequestSchema>;
export type ScheduledWorkOrderCreate = z.infer<typeof ScheduledWorkOrderCreateSchema>;
export type AdminScheduleOverrideRequest = z.infer<typeof AdminScheduleOverrideRequestSchema>;
export type TimeSlotCreate = z.infer<typeof TimeSlotCreateSchema>;
export type TimeSlotUpdate = z.infer<typeof TimeSlotUpdateSchema>;
export type ScheduleConflictCreate = z.infer<typeof ScheduleConflictCreateSchema>;
export type ScheduleConflictResolution = z.infer<typeof ScheduleConflictResolutionSchema>;
export type ScheduleAuditLogCreate = z.infer<typeof ScheduleAuditLogCreateSchema>;

// Forum system derived types
export type ForumCreate = z.infer<typeof ForumCreateSchema>;
export type ForumUpdate = z.infer<typeof ForumUpdateSchema>;
export type ForumTopicCreate = z.infer<typeof ForumTopicCreateSchema>;
export type ForumTopicUpdate = z.infer<typeof ForumTopicUpdateSchema>;
export type ForumPostCreate = z.infer<typeof ForumPostCreateSchema>;
export type ForumPostUpdate = z.infer<typeof ForumPostUpdateSchema>;
export type ForumVoteCreate = z.infer<typeof ForumVoteCreateSchema>;
export type ForumModeration = z.infer<typeof ForumModerationSchema>;
export type ForumFlag = z.infer<typeof ForumFlagSchema>;