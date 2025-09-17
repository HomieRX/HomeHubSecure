import { 
  type InsertUser,
  type InsertContractorProfile,
  type InsertMerchantProfile,
  type InsertDeal,
  type InsertMemberProfile
} from "@shared/schema";
import type { IStorage } from "./storage";

// Sample user data for contractors
export const contractorUsersData: InsertUser[] = [
  {
    id: "contractor-1",
    email: "mike.handyman@homehub.com",
    firstName: "Mike",
    lastName: "Rodriguez",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-2", 
    email: "sarah.electric@homehub.com",
    firstName: "Sarah",
    lastName: "Chen",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-3",
    email: "james.plumber@homehub.com", 
    firstName: "James",
    lastName: "Thompson",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-4",
    email: "maria.appliance@homehub.com",
    firstName: "Maria",
    lastName: "Garcia",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-5",
    email: "david.irrigation@homehub.com",
    firstName: "David",
    lastName: "Johnson",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-6",
    email: "lisa.kitchen@homehub.com",
    firstName: "Lisa",
    lastName: "Williams",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-7",
    email: "robert.hvac@homehub.com",
    firstName: "Robert",
    lastName: "Brown",
    profileImageUrl: null,
    role: "contractor",
    isActive: true
  },
  {
    id: "contractor-8",
    email: "jennifer.multi@homehub.com",
    firstName: "Jennifer",
    lastName: "Davis",
    profileImageUrl: null,
    role: "contractor", 
    isActive: true
  }
];

// Comprehensive contractor profiles data
export const contractorProfilesData: InsertContractorProfile[] = [
  {
    userId: "contractor-1",
    businessName: "Rodriguez Home Repair",
    firstName: "Mike",
    lastName: "Rodriguez", 
    phone: "(555) 123-4567",
    email: "mike.handyman@homehub.com",
    address: "123 Main Street",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    serviceRadius: 25,
    hourlyRate: "45.00",
    licenseNumber: "TX-HR-2024-001",
    licenseType: "General Handyman",
    licenseExpiryDate: new Date("2025-12-31"),
    insuranceProvider: "State Farm Business",
    insurancePolicyNumber: "SF-BIZ-78701-001",
    insuranceExpiryDate: new Date("2025-06-30"),
    bondingProvider: "Liberty Mutual Bonds",
    bondingAmount: "10000.00",
    isVerified: true,
    verifiedAt: new Date("2024-01-15"),
    bio: "Experienced handyman with over 10 years serving Austin area. Specializing in general home repairs, furniture assembly, and minor electrical work. Licensed, insured, and bonded for your peace of mind.",
    specialties: ["Handyman", "Basic Electrical"],
    certifications: ["EPA RRP Certified", "OSHA 10-Hour Safety"],
    yearsExperience: 10,
    portfolioImages: [
      "/images/contractors/rodriguez-kitchen-repair.jpg",
      "/images/contractors/rodriguez-deck-rebuild.jpg"
    ],
    rating: "4.8",
    reviewCount: 127,
    isActive: true,
    availability: {
      monday: { available: true, start: "08:00", end: "17:00" },
      tuesday: { available: true, start: "08:00", end: "17:00" },
      wednesday: { available: true, start: "08:00", end: "17:00" },
      thursday: { available: true, start: "08:00", end: "17:00" },
      friday: { available: true, start: "08:00", end: "17:00" },
      saturday: { available: true, start: "09:00", end: "15:00" },
      sunday: { available: false, start: null, end: null }
    }
  },
  {
    userId: "contractor-2",
    businessName: "Chen Electrical Services", 
    firstName: "Sarah",
    lastName: "Chen",
    phone: "(555) 234-5678",
    email: "sarah.electric@homehub.com",
    address: "456 Oak Avenue", 
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    serviceRadius: 30,
    hourlyRate: "65.00",
    licenseNumber: "TX-EL-2024-002",
    licenseType: "Master Electrician",
    licenseExpiryDate: new Date("2026-03-31"),
    insuranceProvider: "Allstate Commercial",
    insurancePolicyNumber: "AS-COM-75201-002",
    insuranceExpiryDate: new Date("2025-08-15"),
    bondingProvider: "Travelers Bond",
    bondingAmount: "25000.00",
    isVerified: true,
    verifiedAt: new Date("2024-02-01"),
    bio: "Master electrician with 15+ years experience. Specializing in residential electrical installations, repairs, and smart home integrations. Available for emergency calls 24/7.",
    specialties: ["Basic Electrical"],
    certifications: ["Texas Master Electrician", "Smart Home Certified", "Arc Fault Specialist"],
    yearsExperience: 15,
    portfolioImages: [
      "/images/contractors/chen-panel-upgrade.jpg",
      "/images/contractors/chen-smart-switches.jpg"
    ],
    rating: "4.9",
    reviewCount: 89,
    isActive: true,
    availability: {
      monday: { available: true, start: "07:00", end: "18:00" },
      tuesday: { available: true, start: "07:00", end: "18:00" },
      wednesday: { available: true, start: "07:00", end: "18:00" },
      thursday: { available: true, start: "07:00", end: "18:00" },
      friday: { available: true, start: "07:00", end: "18:00" },
      saturday: { available: true, start: "08:00", end: "16:00" },
      sunday: { available: false, start: null, end: null }
    }
  },
  {
    userId: "contractor-3",
    businessName: "Thompson Plumbing Co",
    firstName: "James", 
    lastName: "Thompson",
    phone: "(555) 345-6789",
    email: "james.plumber@homehub.com",
    address: "789 Pine Street",
    city: "Houston",
    state: "TX", 
    zipCode: "77001",
    serviceRadius: 35,
    hourlyRate: "58.00",
    licenseNumber: "TX-PL-2024-003",
    licenseType: "Master Plumber",
    licenseExpiryDate: new Date("2025-09-30"),
    insuranceProvider: "Progressive Commercial",
    insurancePolicyNumber: "PC-BIZ-77001-003",
    insuranceExpiryDate: new Date("2025-11-20"),
    bondingProvider: "Hartford Bonds",
    bondingAmount: "20000.00",
    isVerified: true,
    verifiedAt: new Date("2024-01-20"),
    bio: "Third-generation plumber serving the Houston area for over 12 years. Expert in residential plumbing repairs, installations, and emergency services. No job too big or small!",
    specialties: ["Basic Plumbing", "Water Heater"],
    certifications: ["Texas Master Plumber", "Backflow Prevention", "Gas Line Certified"],
    yearsExperience: 12,
    portfolioImages: [
      "/images/contractors/thompson-bathroom-renovation.jpg",
      "/images/contractors/thompson-water-heater.jpg"
    ],
    rating: "4.7",
    reviewCount: 156,
    isActive: true,
    availability: {
      monday: { available: true, start: "06:00", end: "17:00" },
      tuesday: { available: true, start: "06:00", end: "17:00" },
      wednesday: { available: true, start: "06:00", end: "17:00" },
      thursday: { available: true, start: "06:00", end: "17:00" },
      friday: { available: true, start: "06:00", end: "17:00" },
      saturday: { available: true, start: "08:00", end: "14:00" },
      sunday: { available: true, start: "09:00", end: "15:00" }
    }
  },
  {
    userId: "contractor-4",
    businessName: "Garcia Appliance Experts",
    firstName: "Maria",
    lastName: "Garcia",
    phone: "(555) 456-7890",
    email: "maria.appliance@homehub.com", 
    address: "321 Elm Drive",
    city: "San Antonio",
    state: "TX",
    zipCode: "78201",
    serviceRadius: 20,
    hourlyRate: "52.00",
    licenseNumber: "TX-AP-2024-004",
    licenseType: "Appliance Repair Specialist",
    licenseExpiryDate: new Date("2025-07-31"),
    insuranceProvider: "Farmers Commercial",
    insurancePolicyNumber: "FC-BIZ-78201-004",
    insuranceExpiryDate: new Date("2025-05-15"),
    bondingProvider: "Nationwide Bonds",
    bondingAmount: "15000.00",
    isVerified: true,
    verifiedAt: new Date("2024-02-10"),
    bio: "Certified appliance repair specialist with expertise in all major brands. 8 years of experience fixing dishwashers, ovens, refrigerators, and laundry equipment. Same-day service available.",
    specialties: ["Dishwasher", "Oven", "Microwave", "Refrigerator", "Clothes Washer", "Clothes Dryer"],
    certifications: ["EPA Section 608", "Whirlpool Certified", "Samsung Authorized", "LG Certified"],
    yearsExperience: 8,
    portfolioImages: [
      "/images/contractors/garcia-dishwasher-repair.jpg",
      "/images/contractors/garcia-refrigerator-fix.jpg"
    ],
    rating: "4.9",
    reviewCount: 203,
    isActive: true,
    availability: {
      monday: { available: true, start: "08:00", end: "18:00" },
      tuesday: { available: true, start: "08:00", end: "18:00" },
      wednesday: { available: true, start: "08:00", end: "18:00" },
      thursday: { available: true, start: "08:00", end: "18:00" },
      friday: { available: true, start: "08:00", end: "18:00" },
      saturday: { available: true, start: "09:00", end: "17:00" },
      sunday: { available: false, start: null, end: null }
    }
  },
  {
    userId: "contractor-5",
    businessName: "Johnson Irrigation Systems",
    firstName: "David",
    lastName: "Johnson",
    phone: "(555) 567-8901",
    email: "david.irrigation@homehub.com",
    address: "654 Maple Lane",
    city: "Fort Worth", 
    state: "TX",
    zipCode: "76101",
    serviceRadius: 40,
    hourlyRate: "48.00",
    licenseNumber: "TX-IR-2024-005",
    licenseType: "Irrigation Contractor",
    licenseExpiryDate: new Date("2026-01-31"),
    insuranceProvider: "USAA Commercial",
    insurancePolicyNumber: "US-COM-76101-005",
    insuranceExpiryDate: new Date("2025-12-01"),
    bondingProvider: "American Guarantee",
    bondingAmount: "18000.00",
    isVerified: true,
    verifiedAt: new Date("2024-03-01"),
    bio: "Irrigation specialist with 14 years experience designing and maintaining sprinkler systems. Expert in water conservation, smart controllers, and landscape lighting integration.",
    specialties: ["Basic Irrigation"],
    certifications: ["Irrigation Association Certified", "Hunter Pro Certified", "Rain Bird Select Contractor", "Smart Controller Specialist"],
    yearsExperience: 14,
    portfolioImages: [
      "/images/contractors/johnson-sprinkler-install.jpg", 
      "/images/contractors/johnson-drip-system.jpg"
    ],
    rating: "4.6",
    reviewCount: 78,
    isActive: true,
    availability: {
      monday: { available: true, start: "07:00", end: "16:00" },
      tuesday: { available: true, start: "07:00", end: "16:00" },
      wednesday: { available: true, start: "07:00", end: "16:00" },
      thursday: { available: true, start: "07:00", end: "16:00" },
      friday: { available: true, start: "07:00", end: "16:00" },
      saturday: { available: true, start: "08:00", end: "15:00" },
      sunday: { available: false, start: null, end: null }
    }
  },
  {
    userId: "contractor-6",
    businessName: "Williams Kitchen Solutions",
    firstName: "Lisa",
    lastName: "Williams", 
    phone: "(555) 678-9012",
    email: "lisa.kitchen@homehub.com",
    address: "987 Cedar Court",
    city: "Plano",
    state: "TX",
    zipCode: "75023",
    serviceRadius: 25,
    hourlyRate: "55.00",
    licenseNumber: "TX-KS-2024-006",
    licenseType: "Kitchen Specialist",
    licenseExpiryDate: new Date("2025-10-31"),
    insuranceProvider: "Liberty Mutual",
    insurancePolicyNumber: "LM-BIZ-75023-006",
    insuranceExpiryDate: new Date("2025-09-30"),
    bondingProvider: "Zurich Bonds",
    bondingAmount: "22000.00",
    isVerified: true,
    verifiedAt: new Date("2024-01-25"),
    bio: "Kitchen renovation specialist with 11 years experience. Expert in sink disposals, dishwashers, and complete kitchen remodeling. Certified in multiple appliance brands and plumbing.",
    specialties: ["Sink Disposal", "Dishwasher", "Basic Plumbing"],
    certifications: ["Kitchen & Bath Certified", "InSinkErator Certified", "Moen Pro", "Delta Certified"],
    yearsExperience: 11,
    portfolioImages: [
      "/images/contractors/williams-kitchen-remodel.jpg",
      "/images/contractors/williams-disposal-install.jpg"
    ],
    rating: "4.8",
    reviewCount: 134,
    isActive: true,
    availability: {
      monday: { available: true, start: "08:00", end: "17:00" },
      tuesday: { available: true, start: "08:00", end: "17:00" },
      wednesday: { available: true, start: "08:00", end: "17:00" },
      thursday: { available: true, start: "08:00", end: "17:00" },
      friday: { available: true, start: "08:00", end: "17:00" },
      saturday: { available: true, start: "09:00", end: "16:00" },
      sunday: { available: false, start: null, end: null }
    }
  },
  {
    userId: "contractor-7", 
    businessName: "Brown HVAC Services",
    firstName: "Robert",
    lastName: "Brown",
    phone: "(555) 789-0123",
    email: "robert.hvac@homehub.com",
    address: "159 Birch Boulevard",
    city: "Irving",
    state: "TX",
    zipCode: "75038",
    serviceRadius: 35,
    hourlyRate: "72.00",
    licenseNumber: "TX-HV-2024-007",
    licenseType: "HVAC Contractor",
    licenseExpiryDate: new Date("2026-04-30"),
    insuranceProvider: "State Farm Commercial",
    insurancePolicyNumber: "SF-COM-75038-007",
    insuranceExpiryDate: new Date("2025-10-15"),
    bondingProvider: "CNA Surety",
    bondingAmount: "30000.00",
    isVerified: true,
    verifiedAt: new Date("2024-02-15"),
    bio: "Licensed HVAC contractor with 18 years experience. Specializing in residential heating, cooling, and air quality systems. Available for emergency repairs and routine maintenance.",
    specialties: ["Water Heater", "Basic Electrical"],
    certifications: ["EPA Universal", "NATE Certified", "Carrier Factory Authorized", "Trane Comfort Specialist"],
    yearsExperience: 18,
    portfolioImages: [
      "/images/contractors/brown-hvac-install.jpg",
      "/images/contractors/brown-ductwork.jpg"
    ],
    rating: "4.9",
    reviewCount: 167,
    isActive: true,
    availability: {
      monday: { available: true, start: "07:00", end: "18:00" },
      tuesday: { available: true, start: "07:00", end: "18:00" },
      wednesday: { available: true, start: "07:00", end: "18:00" },
      thursday: { available: true, start: "07:00", end: "18:00" },
      friday: { available: true, start: "07:00", end: "18:00" },
      saturday: { available: true, start: "08:00", end: "16:00" },
      sunday: { available: true, start: "10:00", end: "16:00" }
    }
  },
  {
    userId: "contractor-8",
    businessName: "Davis Multi-Service",
    firstName: "Jennifer",
    lastName: "Davis",
    phone: "(555) 890-1234",
    email: "jennifer.multi@homehub.com",
    address: "753 Willow Way",
    city: "Frisco",
    state: "TX", 
    zipCode: "75034",
    serviceRadius: 30,
    hourlyRate: "62.00",
    licenseNumber: "TX-MS-2024-008",
    licenseType: "Multi-Trade Contractor",
    licenseExpiryDate: new Date("2025-12-15"),
    insuranceProvider: "Travelers Commercial",
    insurancePolicyNumber: "TC-BIZ-75034-008",
    insuranceExpiryDate: new Date("2025-07-31"),
    bondingProvider: "Liberty Bonds",
    bondingAmount: "25000.00",
    isVerified: true,
    verifiedAt: new Date("2024-03-10"),
    bio: "Multi-skilled contractor offering comprehensive home services. 13 years experience in handyman work, basic electrical, plumbing, and appliance repair. One-stop solution for all home needs.",
    specialties: ["Handyman", "Basic Electrical", "Basic Plumbing", "Microwave", "Refrigerator"],
    certifications: ["Multi-Trade Certified", "Electrical Safety", "Plumbing Basics", "Appliance Repair Certified"],
    yearsExperience: 13,
    portfolioImages: [
      "/images/contractors/davis-bathroom-repair.jpg",
      "/images/contractors/davis-electrical-work.jpg"
    ],
    rating: "4.7",
    reviewCount: 98,
    isActive: true,
    availability: {
      monday: { available: true, start: "08:00", end: "17:00" },
      tuesday: { available: true, start: "08:00", end: "17:00" },
      wednesday: { available: true, start: "08:00", end: "17:00" },
      thursday: { available: true, start: "08:00", end: "17:00" },
      friday: { available: true, start: "08:00", end: "17:00" },
      saturday: { available: true, start: "09:00", end: "15:00" },
      sunday: { available: false, start: null, end: null }
    }
  }
];

// Sample user data for merchants
export const merchantUsersData: InsertUser[] = [
  {
    id: "merchant-1",
    email: "info@texashardware.com",
    firstName: "Tom",
    lastName: "Mitchell",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-2",
    email: "contact@gardencenterplus.com",
    firstName: "Karen",
    lastName: "Anderson",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-3",
    email: "sales@electronicsemporium.com",
    firstName: "Michael",
    lastName: "Foster",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-4",
    email: "hello@kitchenworld.com",
    firstName: "Nancy",
    lastName: "Wright",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-5",
    email: "info@protoolsupply.com",
    firstName: "Steve",
    lastName: "Taylor",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-6",
    email: "contact@furnituredesigns.com",
    firstName: "Linda",
    lastName: "Martin",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-7",
    email: "service@appliancecentral.com",
    firstName: "Brian",
    lastName: "Clark",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  },
  {
    id: "merchant-8",
    email: "orders@homeserviceshub.com",
    firstName: "Jessica",
    lastName: "White",
    profileImageUrl: null,
    role: "merchant",
    isActive: true
  }
];

// Comprehensive merchant profiles data
export const merchantProfilesData: InsertMerchantProfile[] = [
  {
    userId: "merchant-1",
    businessName: "Texas Hardware & Supply Co.",
    ownerName: "Tom Mitchell",
    phone: "(555) 111-2222",
    email: "info@texashardware.com",
    website: "www.texashardware.com",
    address: "1234 Commerce Street",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    businessType: "Hardware Store",
    businessDescription: "Full-service hardware store serving Austin for over 30 years. We carry everything from nuts and bolts to major appliances, with expert advice and competitive prices.",
    businessLicense: "TX-HW-2020-001",
    taxId: "75-1234567",
    operatingHours: {
      monday: { open: "07:00", close: "19:00" },
      tuesday: { open: "07:00", close: "19:00" },
      wednesday: { open: "07:00", close: "19:00" },
      thursday: { open: "07:00", close: "19:00" },
      friday: { open: "07:00", close: "19:00" },
      saturday: { open: "08:00", close: "18:00" },
      sunday: { open: "09:00", close: "17:00" }
    },
    serviceArea: "Austin, Cedar Park, Round Rock, Pflugerville",
    specialties: ["Hardware", "Tools", "Plumbing Supplies", "Electrical Supplies", "Paint & Stain"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Check", "Store Credit"],
    businessImages: [
      "/images/merchants/texas-hardware-storefront.jpg",
      "/images/merchants/texas-hardware-interior.jpg"
    ],
    logoUrl: "/images/merchants/texas-hardware-logo.jpg",
    rating: "4.6",
    reviewCount: 342,
    isVerified: true,
    verifiedAt: new Date("2024-01-10"),
    isActive: true
  },
  {
    userId: "merchant-2",
    businessName: "Garden Center Plus",
    ownerName: "Karen Anderson", 
    phone: "(555) 222-3333",
    email: "contact@gardencenterplus.com",
    website: "www.gardencenterplus.com",
    address: "5678 Green Valley Road",
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    businessType: "Garden Center",
    businessDescription: "Premier garden center offering plants, landscaping supplies, and outdoor living products. Expert gardening advice and seasonal workshops available.",
    businessLicense: "TX-GC-2021-002",
    taxId: "75-2345678",
    operatingHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "07:00", close: "19:00" },
      sunday: { open: "09:00", close: "17:00" }
    },
    serviceArea: "Dallas, Richardson, Garland, Mesquite",
    specialties: ["Plants & Trees", "Landscaping Supplies", "Outdoor Furniture", "Irrigation Equipment", "Garden Tools"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "PayPal", "Apple Pay"],
    businessImages: [
      "/images/merchants/garden-center-greenhouse.jpg",
      "/images/merchants/garden-center-plants.jpg"
    ],
    logoUrl: "/images/merchants/garden-center-logo.jpg",
    rating: "4.8",
    reviewCount: 189,
    isVerified: true,
    verifiedAt: new Date("2024-01-15"),
    isActive: true
  },
  {
    userId: "merchant-3",
    businessName: "Electronics Emporium",
    ownerName: "Michael Foster",
    phone: "(555) 333-4444", 
    email: "sales@electronicsemporium.com",
    website: "www.electronicsemporium.com",
    address: "9876 Technology Blvd",
    city: "Houston",
    state: "TX",
    zipCode: "77001",
    businessType: "Electronics Retailer",
    businessDescription: "Leading electronics retailer specializing in smart home devices, appliances, and consumer electronics. Authorized dealer for major brands with installation services.",
    businessLicense: "TX-EL-2022-003",
    taxId: "75-3456789",
    operatingHours: {
      monday: { open: "10:00", close: "20:00" },
      tuesday: { open: "10:00", close: "20:00" },
      wednesday: { open: "10:00", close: "20:00" },
      thursday: { open: "10:00", close: "20:00" },
      friday: { open: "10:00", close: "21:00" },
      saturday: { open: "09:00", close: "21:00" },
      sunday: { open: "11:00", close: "18:00" }
    },
    serviceArea: "Houston, Katy, Sugar Land, The Woodlands",
    specialties: ["Smart Home", "Major Appliances", "Consumer Electronics", "Installation Services", "Tech Support"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Financing", "PayPal", "Google Pay"],
    businessImages: [
      "/images/merchants/electronics-showroom.jpg",
      "/images/merchants/electronics-smart-home.jpg"
    ],
    logoUrl: "/images/merchants/electronics-emporium-logo.jpg",
    rating: "4.7",
    reviewCount: 267,
    isVerified: true,
    verifiedAt: new Date("2024-02-01"),
    isActive: true
  },
  {
    userId: "merchant-4",
    businessName: "Kitchen World",
    ownerName: "Nancy Wright",
    phone: "(555) 444-5555",
    email: "hello@kitchenworld.com",
    website: "www.kitchenworld.com", 
    address: "2468 Culinary Lane",
    city: "San Antonio",
    state: "TX",
    zipCode: "78201",
    businessType: "Kitchen & Bath Showroom",
    businessDescription: "Complete kitchen and bathroom showroom featuring cabinets, countertops, appliances, and fixtures. Professional design consultation and installation services available.",
    businessLicense: "TX-KB-2023-004",
    taxId: "75-4567890",
    operatingHours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "12:00", close: "16:00" }
    },
    serviceArea: "San Antonio, New Braunfels, Boerne, Schertz",
    specialties: ["Kitchen Cabinets", "Countertops", "Kitchen Appliances", "Bath Fixtures", "Design Services"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Check", "Financing Options"],
    businessImages: [
      "/images/merchants/kitchen-world-showroom.jpg",
      "/images/merchants/kitchen-world-displays.jpg"
    ],
    logoUrl: "/images/merchants/kitchen-world-logo.jpg",
    rating: "4.9",
    reviewCount: 156,
    isVerified: true,
    verifiedAt: new Date("2024-02-10"),
    isActive: true
  },
  {
    userId: "merchant-5",
    businessName: "Pro Tool Supply",
    ownerName: "Steve Taylor",
    phone: "(555) 555-6666",
    email: "info@protoolsupply.com",
    website: "www.protoolsupply.com",
    address: "1357 Industrial Drive",
    city: "Fort Worth",
    state: "TX",
    zipCode: "76101", 
    businessType: "Tool & Equipment Retailer",
    businessDescription: "Professional tool supplier serving contractors and DIY enthusiasts. Wide selection of power tools, hand tools, and equipment with rental options available.",
    businessLicense: "TX-TS-2022-005",
    taxId: "75-5678901",
    operatingHours: {
      monday: { open: "06:00", close: "18:00" },
      tuesday: { open: "06:00", close: "18:00" },
      wednesday: { open: "06:00", close: "18:00" },
      thursday: { open: "06:00", close: "18:00" },
      friday: { open: "06:00", close: "18:00" },
      saturday: { open: "07:00", close: "16:00" },
      sunday: { open: "09:00", close: "15:00" }
    },
    serviceArea: "Fort Worth, Arlington, Grapevine, Euless",
    specialties: ["Power Tools", "Hand Tools", "Safety Equipment", "Tool Rentals", "Equipment Repair"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Net 30 Terms", "Equipment Financing"],
    businessImages: [
      "/images/merchants/pro-tool-warehouse.jpg",
      "/images/merchants/pro-tool-display.jpg"
    ],
    logoUrl: "/images/merchants/pro-tool-logo.jpg",
    rating: "4.5",
    reviewCount: 423,
    isVerified: true,
    verifiedAt: new Date("2024-01-20"),
    isActive: true
  },
  {
    userId: "merchant-6",
    businessName: "Furniture & Design Studio",
    ownerName: "Linda Martin",
    phone: "(555) 666-7777",
    email: "contact@furnituredesigns.com",
    website: "www.furnituredesigns.com",
    address: "8642 Style Avenue",
    city: "Plano",
    state: "TX",
    zipCode: "75023",
    businessType: "Furniture Retailer",
    businessDescription: "Contemporary furniture showroom and design studio offering custom furniture, home decor, and interior design services. Quality pieces for every room in your home.",
    businessLicense: "TX-FD-2023-006",
    taxId: "75-6789012",
    operatingHours: {
      monday: { open: "10:00", close: "19:00" },
      tuesday: { open: "10:00", close: "19:00" },
      wednesday: { open: "10:00", close: "19:00" },
      thursday: { open: "10:00", close: "19:00" },
      friday: { open: "10:00", close: "19:00" },
      saturday: { open: "10:00", close: "18:00" },
      sunday: { open: "12:00", close: "17:00" }
    },
    serviceArea: "Plano, Frisco, McKinney, Allen",
    specialties: ["Living Room Furniture", "Bedroom Sets", "Dining Furniture", "Home Decor", "Custom Design"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Layaway", "Interior Design Financing"],
    businessImages: [
      "/images/merchants/furniture-showroom.jpg",
      "/images/merchants/furniture-living-room.jpg"
    ],
    logoUrl: "/images/merchants/furniture-design-logo.jpg",
    rating: "4.8",
    reviewCount: 134,
    isVerified: true,
    verifiedAt: new Date("2024-02-20"),
    isActive: true
  },
  {
    userId: "merchant-7",
    businessName: "Appliance Central",
    ownerName: "Brian Clark",
    phone: "(555) 777-8888",
    email: "service@appliancecentral.com", 
    website: "www.appliancecentral.com",
    address: "7531 Appliance Way",
    city: "Irving",
    state: "TX",
    zipCode: "75038",
    businessType: "Appliance Retailer & Service",
    businessDescription: "Complete appliance center offering sales, service, and installation of major home appliances. Authorized service center for all major brands with same-day repair service.",
    businessLicense: "TX-AP-2021-007",
    taxId: "75-7890123",
    operatingHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "11:00", close: "16:00" }
    },
    serviceArea: "Irving, Dallas, Carrollton, Farmers Branch",
    specialties: ["Major Appliances", "Appliance Repair", "Installation Services", "Extended Warranties", "Parts & Accessories"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Appliance Financing", "Service Plans"],
    businessImages: [
      "/images/merchants/appliance-showroom.jpg",
      "/images/merchants/appliance-service.jpg"
    ],
    logoUrl: "/images/merchants/appliance-central-logo.jpg",
    rating: "4.6",
    reviewCount: 298,
    isVerified: true,
    verifiedAt: new Date("2024-01-30"),
    isActive: true
  },
  {
    userId: "merchant-8",
    businessName: "Home Services Hub",
    ownerName: "Jessica White",
    phone: "(555) 888-9999",
    email: "orders@homeserviceshub.com",
    website: "www.homeserviceshub.com",
    address: "9642 Service Center Blvd",
    city: "Frisco",
    state: "TX",
    zipCode: "75034",
    businessType: "Home Services Provider",
    businessDescription: "One-stop shop for home services including cleaning supplies, maintenance products, and contractor supplies. Serving homeowners and professional contractors.",
    businessLicense: "TX-HS-2023-008",
    taxId: "75-8901234",
    operatingHours: {
      monday: { open: "07:00", close: "19:00" },
      tuesday: { open: "07:00", close: "19:00" },
      wednesday: { open: "07:00", close: "19:00" },
      thursday: { open: "07:00", close: "19:00" },
      friday: { open: "07:00", close: "19:00" },
      saturday: { open: "08:00", close: "18:00" },
      sunday: { open: "10:00", close: "16:00" }
    },
    serviceArea: "Frisco, McKinney, Little Elm, Prosper",
    specialties: ["Cleaning Supplies", "Maintenance Products", "Contractor Supplies", "Safety Equipment", "Bulk Orders"],
    acceptedPaymentMethods: ["Cash", "Credit Card", "Debit Card", "Check", "Business Accounts", "Bulk Order Terms"],
    businessImages: [
      "/images/merchants/home-services-warehouse.jpg",
      "/images/merchants/home-services-supplies.jpg"
    ],
    logoUrl: "/images/merchants/home-services-logo.jpg",
    rating: "4.7",
    reviewCount: 167,
    isVerified: true,
    verifiedAt: new Date("2024-03-01"),
    isActive: true
  }
];

// Comprehensive Savvy Saver deals data 
export const dealsData: Omit<InsertDeal, "merchantId">[] = [
  {
    title: "20% Off Professional Tool Rentals",
    description: "Save 20% on all professional tool rentals including power tools, equipment, and specialty tools. Perfect for weekend projects or professional contractors.",
    category: "Tools & Equipment", 
    discountType: "percentage",
    discountValue: "20.00",
    originalPrice: "50.00",
    finalPrice: "40.00",
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-12-31"),
    isExclusive: false,
    membershipRequired: "HomePRO",
    maxUses: 500,
    currentUses: 0,
    tags: ["tools", "rental", "professional", "equipment"],
    termsAndConditions: "Valid on tool rentals over $25. Cannot be combined with other offers. Membership verification required. Valid ID required for tool rental.",
    images: ["/images/deals/tool-rental-deal.jpg"],
    isActive: true
  },
  {
    title: "$50 Off Kitchen Appliance Installation",
    description: "Get $50 off professional installation when you purchase any major kitchen appliance. Includes dishwashers, ovens, microwaves, and refrigerators.",
    category: "Kitchen & Appliances",
    discountType: "fixed", 
    discountValue: "50.00",
    originalPrice: "150.00",
    finalPrice: "100.00",
    validFrom: new Date("2024-03-01"),
    validUntil: new Date("2024-06-30"),
    isExclusive: true,
    membershipRequired: "HomeHERO",
    maxUses: 200,
    currentUses: 0,
    tags: ["appliances", "installation", "kitchen", "professional-service"],
    termsAndConditions: "Valid with purchase of major kitchen appliance over $500. Installation must be scheduled within 30 days of purchase. Excludes built-in appliances requiring electrical/plumbing modifications.",
    images: ["/images/deals/appliance-install-deal.jpg"],
    isActive: true
  },
  {
    title: "Buy One Get One Free Garden Supplies",
    description: "Buy any garden tool or plant care product and get a second item of equal or lesser value FREE. Build your perfect garden setup!",
    category: "Garden & Outdoor",
    discountType: "bogo",
    discountValue: "100.00",
    originalPrice: "40.00", 
    finalPrice: "20.00",
    validFrom: new Date("2024-04-01"),
    validUntil: new Date("2024-07-31"),
    isExclusive: false,
    membershipRequired: "HomeHUB",
    maxUses: 300,
    currentUses: 0,
    tags: ["garden", "plants", "tools", "seasonal", "bogo"],
    termsAndConditions: "Buy one get one free on items of equal or lesser value. Valid on garden tools, fertilizers, and plant care products. Does not apply to live plants, bulk mulch, or heavy equipment.",
    images: ["/images/deals/garden-bogo-deal.jpg"],
    isActive: true
  },
  {
    title: "Free Shipping on Electronics Orders",
    description: "Free standard shipping on all electronics orders over $100. Includes smart home devices, appliances, and consumer electronics.",
    category: "Electronics",
    discountType: "free_shipping",
    discountValue: "15.00",
    originalPrice: "115.00",
    finalPrice: "100.00", 
    validFrom: new Date("2024-01-15"),
    validUntil: new Date("2024-12-15"),
    isExclusive: false,
    membershipRequired: null,
    maxUses: 1000,
    currentUses: 0,
    tags: ["electronics", "shipping", "smart-home", "no-minimum"],
    termsAndConditions: "Free standard shipping (5-7 business days) on orders over $100. Expedited shipping available for additional fee. Does not apply to oversized items or white glove delivery.",
    images: ["/images/deals/electronics-shipping-deal.jpg"],
    isActive: true
  },
  {
    title: "30% Off Home Cleaning Services",
    description: "Save 30% on professional home cleaning services including deep cleaning, maintenance cleaning, and move-in/move-out cleaning packages.",
    category: "Home Services",
    discountType: "percentage", 
    discountValue: "30.00",
    originalPrice: "200.00",
    finalPrice: "140.00",
    validFrom: new Date("2024-02-01"),
    validUntil: new Date("2024-05-31"),
    isExclusive: true,
    membershipRequired: "HomeGURU",
    maxUses: 100,
    currentUses: 0,
    tags: ["cleaning", "professional-service", "home-maintenance", "premium"],
    termsAndConditions: "Valid for first-time customers only. Minimum 3-hour service required. Does not include specialty cleaning (carpets, windows). HomeGURU membership verification required.",
    images: ["/images/deals/cleaning-service-deal.jpg"],
    isActive: true
  },
  {
    title: "$25 Off Furniture Assembly Service", 
    description: "Professional furniture assembly service with $25 discount. Perfect for large items, complex builds, or when you just don't have the time!",
    category: "Furniture & Assembly",
    discountType: "fixed",
    discountValue: "25.00",
    originalPrice: "75.00",
    finalPrice: "50.00",
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-08-31"),
    isExclusive: false,
    membershipRequired: "HomePRO",
    maxUses: 250,
    currentUses: 0,
    tags: ["furniture", "assembly", "handyman", "time-saver"],
    termsAndConditions: "Valid for furniture assembly jobs estimated at 2+ hours. Does not include wall mounting or electrical connections. Some assembly restrictions may apply for complex items.",
    images: ["/images/deals/furniture-assembly-deal.jpg"],
    isActive: true
  },
  {
    title: "Buy 2 Get 1 Free Plumbing Supplies",
    description: "Stock up on essential plumbing supplies! Buy any 2 plumbing items and get the third item (of equal or lesser value) absolutely free.",
    category: "Plumbing & Hardware", 
    discountType: "bogo",
    discountValue: "33.33",
    originalPrice: "60.00",
    finalPrice: "40.00",
    validFrom: new Date("2024-03-15"),
    validUntil: new Date("2024-09-15"),
    isExclusive: false,
    membershipRequired: "HomeHERO", 
    maxUses: 400,
    currentUses: 0,
    tags: ["plumbing", "hardware", "supplies", "bulk-savings"],
    termsAndConditions: "Buy 2 get 1 free on items of equal or lesser value. Valid on faucets, pipes, fittings, and plumbing accessories. Does not apply to water heaters or major fixtures.",
    images: ["/images/deals/plumbing-bogo-deal.jpg"],
    isActive: true
  },
  {
    title: "Free Delivery on Appliance Orders",
    description: "Complimentary white glove delivery service on all major appliance purchases over $750. Includes delivery, setup, and old appliance removal.",
    category: "Appliances & Installation",
    discountType: "free_shipping", 
    discountValue: "100.00",
    originalPrice: "850.00",
    finalPrice: "750.00",
    validFrom: new Date("2024-02-15"), 
    validUntil: new Date("2024-10-31"),
    isExclusive: true,
    membershipRequired: "HomeGURU",
    maxUses: 150,
    currentUses: 0,
    tags: ["appliances", "delivery", "white-glove", "premium-service"],
    termsAndConditions: "Free white glove delivery on appliance orders over $750. Includes basic setup and removal of old appliance. Electrical/plumbing connections available for additional fee. Delivery scheduling required.",
    images: ["/images/deals/appliance-delivery-deal.jpg"],
    isActive: true
  }
];

// Sample member profiles for deal redemption testing
export const sampleMemberProfilesData: InsertMemberProfile[] = [
  {
    userId: "47540661", // Use existing admin user
    nickname: "AdminUser",
    firstName: "Admin",
    lastName: "User", 
    email: "admin@homehub.com",
    phone: "(555) 000-0000",
    membershipTier: "HomeGURU",
    loyaltyPoints: 1000,
    bio: "HomeHub platform administrator",
    location: "Austin, TX",
    address: "123 Admin Street",
    city: "Austin",
    state: "TX",
    zipCode: "78701"
  }
];

// Seed function to populate all data
export async function seedComprehensiveData(storage: IStorage): Promise<void> {
  console.log("🌱 Starting comprehensive HomeHub seed data...");
  
  try {
    // Check if data already exists
    const existingContractors = await storage.getAllContractorProfiles();
    const existingMerchants = await storage.getAllMerchantProfiles(); 
    const existingDeals = await storage.getAllDeals();
    
    if (existingContractors.length > 0 || existingMerchants.length > 0 || existingDeals.length > 0) {
      console.log("⚠️ Comprehensive seed data already exists, skipping...");
      return;
    }
    
    // Seed contractor users and profiles
    console.log("👷 Creating contractor users and profiles...");
    for (let i = 0; i < contractorUsersData.length; i++) {
      const userData = contractorUsersData[i];
      const profileData = contractorProfilesData[i];
      
      try {
        await storage.createUser(userData);
        await storage.createContractorProfile(profileData);
        console.log(`✅ Created contractor: ${profileData.businessName}`);
      } catch (error) {
        console.error(`❌ Failed to create contractor ${profileData.businessName}:`, error);
      }
    }
    
    // Seed merchant users and profiles
    console.log("🏪 Creating merchant users and profiles...");
    for (let i = 0; i < merchantUsersData.length; i++) {
      const userData = merchantUsersData[i];
      const profileData = merchantProfilesData[i];
      
      try {
        await storage.createUser(userData);
        const merchant = await storage.createMerchantProfile(profileData);
        console.log(`✅ Created merchant: ${profileData.businessName}`);
        
        // Create deals for this merchant
        if (i < dealsData.length) {
          const dealData = {
            ...dealsData[i],
            merchantId: merchant.id
          };
          await storage.createDeal(dealData);
          console.log(`💰 Created deal: ${dealData.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create merchant ${profileData.businessName}:`, error);
      }
    }
    
    // Create sample member profiles if needed
    console.log("👥 Creating sample member profiles...");
    for (const memberData of sampleMemberProfilesData) {
      try {
        const existingMember = await storage.getMemberProfileByUserId(memberData.userId);
        if (!existingMember) {
          await storage.createMemberProfile(memberData);
          console.log(`✅ Created member profile: ${memberData.nickname}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create member profile ${memberData.nickname}:`, error);
      }
    }
    
    console.log("🎉 Comprehensive seed data completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   • ${contractorProfilesData.length} Contractors created`);
    console.log(`   • ${merchantProfilesData.length} Merchants created`);
    console.log(`   • ${dealsData.length} Savvy Saver deals created`);
    console.log(`   • ${sampleMemberProfilesData.length} Sample members created`);
    
  } catch (error) {
    console.error("❌ Error during comprehensive seed:", error);
    throw error;
  }
}