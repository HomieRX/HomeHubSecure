import { z } from "zod";

// Base types from schema
export type MembershipTier = "HomeHUB" | "HomePRO" | "HomeHERO" | "HomeGURU";
export type ServiceType = "FixiT" | "PreventiT" | "HandleiT" | "CheckiT" | "LoyalizeiT";
export type ServiceCategory = "Handyman" | "Dishwasher" | "Oven" | "Microwave" | "Refrigerator" | "Sink Disposal" | "Clothes Washer" | "Clothes Dryer" | "Water Heater" | "Basic Electrical" | "Basic Irrigation" | "Basic Plumbing";
export type UrgencyLevel = "low" | "normal" | "high" | "emergency";

// User and Profile Types
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "homeowner" | "contractor" | "merchant" | "admin";
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