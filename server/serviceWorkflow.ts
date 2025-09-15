import { ServiceRequest, InsertServiceRequest, memberProfiles, serviceRequests } from "@shared/schema";
import { eq } from "drizzle-orm";

// Service Type Definitions
export type ServiceType = "FixiT" | "PreventiT" | "HandleiT" | "CheckiT" | "LoyalizeiT";

// Service Configuration for each type
export interface ServiceConfig {
  name: string;
  description: string;
  billingModel: "hourly" | "session" | "project" | "points";
  requiresEscrow: boolean;
  isSeasonalService: boolean;
  seasonalWindows?: string[];
  defaultSlotDuration: number; // minutes
  membershipRequired?: string[];
  pointsReward: number;
  features: string[];
}

// Service Configurations
export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  FixiT: {
    name: "FixiT! Diagnostic & Repair",
    description: "Quick diagnostic and repair services with hourly billing",
    billingModel: "hourly",
    requiresEscrow: false,
    isSeasonalService: false,
    defaultSlotDuration: 60,
    pointsReward: 100,
    features: [
      "Expert diagnostics",
      "Same-day service available",
      "Hourly billing model",
      "Licensed technicians",
      "Warranty on repairs"
    ]
  },
  PreventiT: {
    name: "PreventiT! Seasonal Maintenance",
    description: "Preventive maintenance with seasonal scheduling windows",
    billingModel: "session",
    requiresEscrow: false,
    isSeasonalService: true,
    seasonalWindows: ["Feb-Mar", "Jul-Aug"],
    defaultSlotDuration: 120,
    pointsReward: 150,
    features: [
      "Seasonal maintenance windows",
      "Preventive care focus",
      "Session-based pricing",
      "Comprehensive inspections",
      "Maintenance reporting"
    ]
  },
  HandleiT: {
    name: "HandleiT! Contractor Marketplace",
    description: "Large project marketplace with escrow payment protection",
    billingModel: "project",
    requiresEscrow: true,
    isSeasonalService: false,
    defaultSlotDuration: 480, // 8 hours
    membershipRequired: ["HomePRO", "HomeHERO", "HomeGURU"],
    pointsReward: 300,
    features: [
      "Escrow payment protection",
      "Vetted contractor network",
      "Project milestone tracking",
      "Quality guarantees",
      "Dispute resolution"
    ]
  },
  CheckiT: {
    name: "CheckiT! Home Inspection",
    description: "Comprehensive home inspection and health monitoring",
    billingModel: "session",
    requiresEscrow: false,
    isSeasonalService: false,
    defaultSlotDuration: 180, // 3 hours
    pointsReward: 200,
    features: [
      "Comprehensive inspections",
      "Digital reporting",
      "Photo documentation",
      "Safety assessments",
      "Maintenance recommendations"
    ]
  },
  LoyalizeiT: {
    name: "LoyalizeiT! Rewards Program",
    description: "Loyalty rewards and community benefits system",
    billingModel: "points",
    requiresEscrow: false,
    isSeasonalService: false,
    defaultSlotDuration: 30,
    pointsReward: 50,
    features: [
      "Points-based rewards",
      "Membership tier benefits",
      "Community engagement",
      "Exclusive deals access",
      "Referral bonuses"
    ]
  }
};

// Membership Tier Benefits
export const MEMBERSHIP_BENEFITS = {
  HomeHUB: {
    services: ["FixiT"],
    pointsMultiplier: 1.0,
    priorityBooking: false,
    discountPercentage: 0
  },
  HomePRO: {
    services: ["FixiT", "PreventiT", "CheckiT"],
    pointsMultiplier: 1.25,
    priorityBooking: true,
    discountPercentage: 5
  },
  HomeHERO: {
    services: ["FixiT", "PreventiT", "HandleiT", "CheckiT"],
    pointsMultiplier: 1.5,
    priorityBooking: true,
    discountPercentage: 10
  },
  HomeGURU: {
    services: ["FixiT", "PreventiT", "HandleiT", "CheckiT", "LoyalizeiT"],
    pointsMultiplier: 2.0,
    priorityBooking: true,
    discountPercentage: 15
  }
};

// Service Workflow Manager
export class ServiceWorkflowManager {
  
  // Validate service request based on service type
  static validateServiceRequest(
    serviceType: ServiceType, 
    membershipTier: string,
    requestData: Partial<InsertServiceRequest>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SERVICE_CONFIGS[serviceType];
    const benefits = MEMBERSHIP_BENEFITS[membershipTier as keyof typeof MEMBERSHIP_BENEFITS];

    // Check membership tier access
    if (config.membershipRequired && !config.membershipRequired.includes(membershipTier)) {
      errors.push(`${config.name} requires ${config.membershipRequired.join(" or ")} membership`);
    }

    // Check if member has access to this service type
    if (!benefits.services.includes(serviceType)) {
      errors.push(`Your ${membershipTier} membership does not include ${config.name}`);
    }

    // Validate seasonal service timing
    if (config.isSeasonalService && requestData.preferredDateTime) {
      const requestMonth = new Date(requestData.preferredDateTime).getMonth() + 1;
      const isValidSeason = this.isValidSeasonalTiming(serviceType, requestMonth);
      if (!isValidSeason) {
        errors.push(`${config.name} is only available during ${config.seasonalWindows?.join(" and ")} seasonal windows`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check if current timing is valid for seasonal services
  static isValidSeasonalTiming(serviceType: ServiceType, month: number): boolean {
    const config = SERVICE_CONFIGS[serviceType];
    if (!config.isSeasonalService) return true;

    // PreventiT seasonal windows: Feb-Mar (2-3) and Jul-Aug (7-8)
    if (serviceType === "PreventiT") {
      return (month >= 2 && month <= 3) || (month >= 7 && month <= 8);
    }

    return true;
  }

  // Calculate service pricing based on type and membership
  static calculateServicePricing(
    serviceType: ServiceType,
    membershipTier: string,
    estimatedDuration: number,
    baseRate: number = 75 // default hourly rate
  ): {
    basePrice: number;
    membershipDiscount: number;
    finalPrice: number;
    pointsReward: number;
    escrowRequired: boolean;
  } {
    const config = SERVICE_CONFIGS[serviceType];
    const benefits = MEMBERSHIP_BENEFITS[membershipTier as keyof typeof MEMBERSHIP_BENEFITS];

    let basePrice = 0;

    switch (config.billingModel) {
      case "hourly":
        basePrice = (estimatedDuration / 60) * baseRate;
        break;
      case "session":
        basePrice = baseRate * 2; // Session rate
        break;
      case "project":
        basePrice = baseRate * (estimatedDuration / 60) * 1.5; // Premium for projects
        break;
      case "points":
        basePrice = 0; // Points-based service
        break;
    }

    const membershipDiscount = basePrice * (benefits.discountPercentage / 100);
    const finalPrice = basePrice - membershipDiscount;
    const pointsReward = Math.floor(config.pointsReward * benefits.pointsMultiplier);

    return {
      basePrice,
      membershipDiscount,
      finalPrice,
      pointsReward,
      escrowRequired: config.requiresEscrow && finalPrice > 500 // Escrow for large projects
    };
  }

  // Process service request workflow
  static processServiceRequest(
    serviceType: ServiceType,
    requestData: InsertServiceRequest,
    membershipTier: string
  ): InsertServiceRequest {
    const config = SERVICE_CONFIGS[serviceType];
    const benefits = MEMBERSHIP_BENEFITS[membershipTier as keyof typeof MEMBERSHIP_BENEFITS];

    // Auto-populate service-specific fields with defaults for required fields
    const processedRequest: InsertServiceRequest = {
      ...requestData,
      serviceType,
      isSeasonalService: config.isSeasonalService,
      slotDuration: config.defaultSlotDuration,
      requiresEscrow: config.requiresEscrow,
      pointsReward: Math.floor(config.pointsReward * benefits.pointsMultiplier),
      // Ensure all required fields have values with appropriate defaults
      urgency: requestData.urgency || "normal",
      estimatedDuration: requestData.estimatedDuration || config.defaultSlotDuration,
      estimatedCost: requestData.estimatedCost || "0.00",
      escrowAmount: requestData.escrowAmount || undefined,
      requiredSkills: requestData.requiredSkills || [],
      images: requestData.images || undefined,
      memberNotes: requestData.memberNotes || undefined,
      internalNotes: requestData.internalNotes || undefined,
      serviceMetadata: requestData.serviceMetadata || undefined,
      preferredDateTime: requestData.preferredDateTime || undefined,
      homeManagerId: requestData.homeManagerId || undefined,
      seasonalWindow: requestData.seasonalWindow || undefined,
    };

    // Set seasonal window if applicable
    if (config.isSeasonalService && config.seasonalWindows) {
      const currentMonth = new Date().getMonth() + 1;
      const seasonalWindow = this.getCurrentSeasonalWindow(serviceType, currentMonth);
      processedRequest.seasonalWindow = seasonalWindow;
    }

    // Calculate pricing
    if (requestData.estimatedDuration) {
      const pricing = this.calculateServicePricing(
        serviceType,
        membershipTier,
        requestData.estimatedDuration,
        75
      );
      
      processedRequest.estimatedCost = pricing.finalPrice.toString();
      processedRequest.requiresEscrow = pricing.escrowRequired;
      processedRequest.pointsReward = pricing.pointsReward;
      
      // Set escrow amount if required
      if (pricing.escrowRequired) {
        processedRequest.escrowAmount = pricing.finalPrice.toString();
      }
    }

    return processedRequest;
  }

  // Get current seasonal window
  static getCurrentSeasonalWindow(serviceType: ServiceType, month: number): string | undefined {
    if (serviceType === "PreventiT") {
      if (month >= 2 && month <= 3) return "spring";
      if (month >= 7 && month <= 8) return "summer";
    }
    return undefined;
  }

  // Get available services for membership tier
  static getAvailableServices(membershipTier: string): ServiceType[] {
    const benefits = MEMBERSHIP_BENEFITS[membershipTier as keyof typeof MEMBERSHIP_BENEFITS];
    return benefits.services as ServiceType[];
  }

  // Get service configuration
  static getServiceConfig(serviceType: ServiceType): ServiceConfig {
    return SERVICE_CONFIGS[serviceType];
  }

  // Check if service is currently available (seasonal check)
  static isServiceAvailable(serviceType: ServiceType): boolean {
    const config = SERVICE_CONFIGS[serviceType];
    if (!config.isSeasonalService) return true;

    const currentMonth = new Date().getMonth() + 1;
    return this.isValidSeasonalTiming(serviceType, currentMonth);
  }
}

// All types and utilities are already exported above