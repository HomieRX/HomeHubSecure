import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  integer,
  decimal,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for better type safety
export const userRoleEnum = pgEnum("user_role", [
  "homeowner",
  "contractor",
  "merchant",
  "admin",
]);
export const membershipTierEnum = pgEnum("membership_tier", [
  "HomeHUB",
  "HomePRO",
  "HomeHERO",
  "HomeGURU",
]);

// Core HomeHub Service Types
export const serviceTypeEnum = pgEnum("service_type", [
  "FixiT",
  "PreventiT",
  "HandleiT",
  "CheckiT",
  "LoyalizeiT",
]);

// Service Categories (keep existing for backward compatibility)
export const serviceCategory = pgEnum("service_category", [
  "Handyman",
  "Dishwasher",
  "Oven",
  "Microwave",
  "Refrigerator",
  "Sink Disposal",
  "Clothes Washer",
  "Clothes Dryer",
  "Water Heater",
  "Basic Electrical",
  "Basic Irrigation",
  "Basic Plumbing",
]);

// Enhanced workflow status enums
export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "on_hold",
  "requires_approval",
]);
export const workOrderStatusEnum = pgEnum("work_order_status", [
  "created",
  "in_progress",
  "completed",
  "cancelled",
]);
export const estimateStatusEnum = pgEnum("estimate_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

// Payment and escrow enums
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded",
]);
export const escrowStatusEnum = pgEnum("escrow_status", [
  "pending",
  "funded",
  "released",
  "disputed",
  "refunded",
]);

// PreventiT! Bundle System Enums
export const bundleStatusEnum = pgEnum("bundle_status", [
  "draft",
  "submitted",
  "edit_requested",
  "edit_window_open",
  "scheduled",
  "member_confirmed",
  "member_unconfirmed",
  "in_progress",
  "completed",
  "cancelled",
  "deferred",
]);

export const editRequestStatusEnum = pgEnum("edit_request_status", [
  "pending",
  "approved", 
  "denied",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms", 
  "in_app",
]);

export const seasonalWindowEnum = pgEnum("seasonal_window", [
  "Feb-Mar",
  "Jul-Aug",
]);

// Scheduling System Enums
export const slotTypeEnum = pgEnum("slot_type", [
  "standard",    // Regular maintenance/service slots
  "emergency",   // Emergency service slots
  "inspection",  // Inspection-only slots
  "consultation",// Consultation/estimate slots
  "followup",   // Follow-up work slots
]);

export const slotDurationEnum = pgEnum("slot_duration", [
  "1_hour",      // 1 hour slots
  "2_hour",      // 2 hour slots  
  "4_hour",      // 4 hour slots (half day)
  "8_hour",      // 8 hour slots (full day)
  "custom",      // Custom duration
]);

export const conflictSeverityEnum = pgEnum("conflict_severity", [
  "hard",        // Direct time overlap - cannot book
  "soft",        // Near overlap - warning but can book
  "travel",      // Travel time conflict
]);

export const auditActionEnum = pgEnum("audit_action", [
  "schedule_created",
  "schedule_updated", 
  "schedule_cancelled",
  "conflict_detected",
  "admin_override",
  "slot_generated",
]);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Updated for Replit Auth compatibility
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  // Legacy fields (temporary - will be removed in step 2)
  username: text("username").unique(),
  password: text("password"),
  // New Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Business fields (preserved)
  role: userRoleEnum("role").notNull().default("homeowner"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberProfiles = pgTable("member_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"), // Keep temporarily to avoid rename conflict
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  membershipTier: membershipTierEnum("membership_tier")
    .notNull()
    .default("HomeHUB"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  bio: text("bio"),
  location: text("location"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  homeManagerId: varchar("home_manager_id").references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contractorProfiles = pgTable("contractor_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  serviceRadius: integer("service_radius").notNull().default(25), // miles
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  licenseNumber: text("license_number").notNull(),
  licenseType: text("license_type").notNull(),
  licenseExpiryDate: timestamp("license_expiry_date").notNull(),
  insuranceProvider: text("insurance_provider").notNull(),
  insurancePolicyNumber: text("insurance_policy_number").notNull(),
  insuranceExpiryDate: timestamp("insurance_expiry_date").notNull(),
  bondingProvider: text("bonding_provider"),
  bondingAmount: decimal("bonding_amount", { precision: 10, scale: 2 }),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  bio: text("bio"),
  specialties: jsonb("specialties").$type<string[]>(), // service categories they specialize in
  certifications: jsonb("certifications").$type<string[]>(),
  yearsExperience: integer("years_experience"),
  portfolioImages: jsonb("portfolio_images").$type<string[]>(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  availability: jsonb("availability"), // schedule data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const merchantProfiles = pgTable("merchant_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  businessType: text("business_type").notNull(), // Hardware Store, Garden Center, etc.
  businessDescription: text("business_description").notNull(),
  businessLicense: text("business_license").notNull(),
  taxId: text("tax_id").notNull(),
  operatingHours: jsonb("operating_hours"), // schedule data
  serviceArea: text("service_area"), // cities/areas they serve
  specialties: jsonb("specialties").$type<string[]>(), // what they specialize in
  acceptedPaymentMethods: jsonb("accepted_payment_methods").$type<string[]>(),
  businessImages: jsonb("business_images").$type<string[]>(),
  logoUrl: text("logo_url"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const homeDetails = pgTable("home_details", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => memberProfiles.id, { onDelete: "cascade" }),
  propertyType: text("property_type"),
  yearBuilt: varchar("year_built"),
  squareFootage: varchar("square_footage"),
  bedrooms: varchar("bedrooms"),
  bathrooms: varchar("bathrooms"),
  lotSize: text("lot_size"),
  heatingType: text("heating_type"),
  coolingType: text("cooling_type"),
  roofType: text("roof_type"),
  foundation: text("foundation"),
  flooring: text("flooring"),
  appliances: jsonb("appliances"),
  specialFeatures: text("special_features"),
  maintenanceNotes: text("maintenance_notes"),
  emergencyContacts: jsonb("emergency_contacts"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),

  // Service Type and Category
  serviceType: serviceTypeEnum("service_type").notNull(), // Core HomeHub service type
  category: serviceCategory("category").notNull(), // Specific category within service type

  // Basic Request Info
  title: text("title").notNull(),
  description: text("description").notNull(),
  urgency: text("urgency").notNull().default("normal"), // low, normal, high, emergency

  // Location and Timing
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  preferredDateTime: timestamp("preferred_date_time"),
  
  // ADDED: Preferred dates handling (up to 3 dates with time preferences)
  preferredDates: jsonb("preferred_dates").$type<{
    date1?: string; // ISO date string
    time1?: string; // Preferred time window ("AM", "PM", or specific time)
    date2?: string;
    time2?: string;
    date3?: string;
    time3?: string;
    notes?: string; // Additional scheduling preferences
  }>(),

  // Scheduling and Seasonal Controls (for PreventiT!)
  isSeasonalService: boolean("is_seasonal_service").notNull().default(false),
  seasonalWindow: text("seasonal_window"), // "spring", "summer", "fall", "winter"
  slotDuration: integer("slot_duration").default(60), // minutes
  requiredSkills: jsonb("required_skills").$type<string[]>(),

  // Workflow and Assignment
  status: serviceRequestStatusEnum("status").notNull().default("pending"),
  homeManagerId: varchar("home_manager_id").references(() => users.id),
  assignedContractorId: varchar("assigned_contractor_id").references(
    () => contractorProfiles.id,
  ),
  assignedAt: timestamp("assigned_at"),

  // Time Tracking
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  estimatedDuration: integer("estimated_duration"), // minutes
  actualDuration: integer("actual_duration"), // minutes

  // Payment and Pricing (enhanced for HandleiT! escrow)
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 2 }),
  finalCost: decimal("final_cost", { precision: 8, scale: 2 }),
  requiresEscrow: boolean("requires_escrow").notNull().default(false),
  escrowAmount: decimal("escrow_amount", { precision: 8, scale: 2 }),
  escrowStatus: escrowStatusEnum("escrow_status"),

  // Loyalty and Rewards (for LoyalizeiT!)
  pointsReward: integer("points_reward").default(0),
  membershipBenefitApplied: boolean("membership_benefit_applied")
    .notNull()
    .default(false),
  loyaltyDiscountApplied: decimal("loyalty_discount_applied", {
    precision: 5,
    scale: 2,
  }).default("0.00"),

  // Documentation
  images: jsonb("images").$type<string[]>(),
  memberNotes: text("member_notes"),
  internalNotes: text("internal_notes"), // for home manager use
  completionNotes: text("completion_notes"),

  // Metadata
  serviceMetadata: jsonb("service_metadata"), // Service-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id")
    .notNull()
    .references(() => serviceRequests.id),
  homeManagerId: varchar("home_manager_id")
    .notNull()
    .references(() => users.id),
  contractorId: varchar("contractor_id").references(
    () => contractorProfiles.id,
  ),
  workOrderNumber: text("work_order_number").notNull().unique(),
  status: workOrderStatusEnum("status").notNull().default("created"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  
  // Enhanced scheduling fields for conflict-aware system
  assignedSlotId: varchar("assigned_slot_id").references(() => timeSlots.id),
  scheduledDuration: integer("scheduled_duration_minutes"), // Duration in minutes
  slotType: slotTypeEnum("slot_type").default("standard"),
  memberPreferredDates: jsonb("member_preferred_dates").$type<{
    preferredDate1?: string; // ISO date string
    preferredTime1?: string; // ISO time string
    preferredDate2?: string;
    preferredTime2?: string; 
    preferredDate3?: string;
    preferredTime3?: string;
    notes?: string; // Additional scheduling preferences
  }>(),
  hasSchedulingConflicts: boolean("has_scheduling_conflicts").notNull().default(false),
  conflictOverrideReason: text("conflict_override_reason"), // Reason for admin override
  conflictOverrideBy: varchar("conflict_override_by").references(() => users.id),
  conflictOverrideAt: timestamp("conflict_override_at"),
  workDescription: text("work_description").notNull(),
  materialsNeeded: jsonb("materials_needed"),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  workNotes: text("work_notes"),
  completionNotes: text("completion_notes"),
  beforeImages: jsonb("before_images").$type<string[]>(),
  afterImages: jsonb("after_images").$type<string[]>(),
  attachments: jsonb("attachments").$type<string[]>(),
  memberSignature: text("member_signature"), // digital signature
  contractorSignature: text("contractor_signature"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one work order per service request
  uniqueServiceRequest: unique("unique_work_order_service_request").on(table.serviceRequestId),
}));

export const estimates = pgTable("estimates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id")
    .notNull()
    .references(() => serviceRequests.id),
  contractorId: varchar("contractor_id")
    .notNull()
    .references(() => contractorProfiles.id),
  estimateNumber: text("estimate_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  laborCost: decimal("labor_cost", { precision: 8, scale: 2 }).notNull(),
  materialCost: decimal("material_cost", { precision: 8, scale: 2 }).notNull(),
  additionalCosts: decimal("additional_costs", {
    precision: 8,
    scale: 2,
  }).default("0.00"),
  totalCost: decimal("total_cost", { precision: 8, scale: 2 }).notNull(),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  materials: jsonb("materials"), // list of materials with costs
  laborBreakdown: jsonb("labor_breakdown"), // detailed labor costs
  terms: text("terms"), // terms and conditions
  validUntil: timestamp("valid_until").notNull(),
  status: estimateStatusEnum("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  notes: text("notes"),
  attachments: jsonb("attachments").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id")
    .references(() => workOrders.id),
  estimateId: varchar("estimate_id")
    .references(() => estimates.id),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subtotal: decimal("subtotal", { precision: 8, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 8, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 8, scale: 2 }).notNull(),
  loyaltyPointsUsed: integer("loyalty_points_used").notNull().default(0),
  loyaltyPointsValue: decimal("loyalty_points_value", {
    precision: 8,
    scale: 2,
  })
    .notNull()
    .default("0.00"),
  amountDue: decimal("amount_due", { precision: 8, scale: 2 }).notNull(),
  loyaltyPointsEarned: integer("loyalty_points_earned").notNull().default(0),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  lineItems: jsonb("line_items").notNull(), // detailed breakdown of charges
  notes: text("notes"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraints for data integrity and race condition prevention
  uniqueWorkOrder: unique("unique_invoice_work_order").on(table.workOrderId),
  uniqueEstimate: unique("unique_invoice_estimate").on(table.estimateId), 
  uniqueTransaction: unique("unique_invoice_transaction").on(table.transactionId),
  // Check constraint: invoice must be linked to either work order OR estimate, not both
  checkInvoiceSource: sql`CHECK ((work_order_id IS NOT NULL AND estimate_id IS NULL) OR (work_order_id IS NULL AND estimate_id IS NOT NULL))`,
}));

export const loyaltyPointTransactions = pgTable("loyalty_point_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),
  transactionType: text("transaction_type").notNull(), // earned, spent, expired, adjusted
  points: integer("points").notNull(),
  description: text("description").notNull(),
  referenceId: varchar("reference_id"), // ID of related invoice, service, etc.
  referenceType: text("reference_type"), // invoice, service_completion, referral, etc.
  expiresAt: timestamp("expires_at"), // for earned points
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => merchantProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed, bogo
  discountValue: decimal("discount_value", {
    precision: 5,
    scale: 2,
  }).notNull(),
  originalPrice: decimal("original_price", { precision: 8, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 8, scale: 2 }),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isExclusive: boolean("is_exclusive").notNull().default(false),
  membershipRequired: membershipTierEnum("membership_required"),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  tags: jsonb("tags").$type<string[]>(),
  termsAndConditions: text("terms_and_conditions").notNull(),
  images: jsonb("images").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dealRedemptions = pgTable("deal_redemptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id")
    .notNull()
    .references(() => deals.id),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),
  redemptionCode: text("redemption_code").notNull().unique(),
  usedAt: timestamp("used_at"),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  images: jsonb("images").$type<string[]>(),
  tags: jsonb("tags").$type<string[]>(),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const communityGroups = pgTable("community_groups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  coverImage: text("cover_image"),
  memberCount: integer("member_count").notNull().default(0),
  tags: jsonb("tags").$type<string[]>(),
  location: text("location"),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: varchar("receiver_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  threadId: varchar("thread_id"),
  attachments: jsonb("attachments"),
  messageType: text("message_type").default("general"), // general, service_related, system
  relatedEntityId: varchar("related_entity_id"), // service request, work order, etc.
  relatedEntityType: text("related_entity_type"), // service_request, work_order, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  eventType: text("event_type").notNull(),
  location: text("location"),
  attendees: jsonb("attendees"),
  reminderMinutes: varchar("reminder_minutes").default("15"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrencePattern: text("recurrence_pattern"),
  relatedEntityId: varchar("related_entity_id"), // service request, work order, etc.
  relatedEntityType: text("related_entity_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// PreventiT! Bundle System Tables

export const membershipTierLimits = pgTable("membership_tier_limits", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  membershipTier: membershipTierEnum("membership_tier").notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  itemsAllowed: integer("items_allowed").notNull(),
  cyclePeriodDays: integer("cycle_period_days").notNull().default(90), // quarterly
  upgradePrice: decimal("upgrade_price", { precision: 8, scale: 2 }),
  addOnPricePerItem: decimal("add_on_price_per_item", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one limit config per tier/service type combination
  uniqueTierServiceType: index("unique_tier_service_type").on(table.membershipTier, table.serviceType),
}));

export const maintenanceItems = pgTable("maintenance_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // HVAC, Plumbing, Electrical, etc.
  estimatedMinutes: integer("estimated_minutes").notNull(),
  seasonalWindow: seasonalWindowEnum("seasonal_window"),
  requiredSkills: jsonb("required_skills").$type<string[]>(),
  materialsNeeded: jsonb("materials_needed").$type<string[]>(),
  toolsNeeded: jsonb("tools_needed").$type<string[]>(),
  safetyNotes: text("safety_notes"),
  instructions: text("instructions"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const maintenanceBundles = pgTable("maintenance_bundles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),
  
  // Bundle details
  bundleName: text("bundle_name"),
  itemCount: integer("item_count").notNull().default(0),
  estimatedTotalMinutes: integer("estimated_total_minutes").notNull().default(0),
  
  // Address and scheduling
  serviceAddress: text("service_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  
  // Preferred dates (up to 3)
  preferredDate1: timestamp("preferred_date_1"),
  preferredTimeWindow1: text("preferred_time_window_1"), // AM/PM or specific 2-hour slot
  preferredDate2: timestamp("preferred_date_2"),
  preferredTimeWindow2: text("preferred_time_window_2"),
  preferredDate3: timestamp("preferred_date_3"),
  preferredTimeWindow3: text("preferred_time_window_3"),
  
  // Scheduling and confirmation
  scheduledDate: timestamp("scheduled_date"),
  scheduledTimeWindow: text("scheduled_time_window"),
  confirmedByMember: boolean("confirmed_by_member").notNull().default(false),
  confirmationDeadline: timestamp("confirmation_deadline"),
  
  // State and workflow
  status: bundleStatusEnum("status").notNull().default("draft"),
  
  // Notes and metadata
  memberNotes: text("member_notes"),
  adminNotes: text("admin_notes"),
  internalNotes: text("internal_notes"),
  
  // Tier enforcement
  membershipTierAtSubmission: membershipTierEnum("membership_tier_at_submission"),
  itemsAllowedAtSubmission: integer("items_allowed_at_submission"),
  isAddOnPurchase: boolean("is_add_on_purchase").notNull().default(false),
  addOnAmount: decimal("add_on_amount", { precision: 8, scale: 2 }),
  
  // Audit fields
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for common queries
  memberIdStatusIndex: index("bundles_member_status_idx").on(table.memberId, table.status),
  scheduledDateIndex: index("bundles_scheduled_date_idx").on(table.scheduledDate),
  // Address binding constraint - one active bundle per member/address combination
  addressBindingIndex: index("bundles_address_binding_idx").on(table.memberId, table.serviceAddress, table.status),
}));

export const bundleItems = pgTable("bundle_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id")
    .notNull()
    .references(() => maintenanceBundles.id, { onDelete: "cascade" }),
  maintenanceItemId: varchar("maintenance_item_id")
    .notNull()
    .references(() => maintenanceItems.id),
  
  // Override fields (if different from catalog item)
  customInstructions: text("custom_instructions"),
  priorityOrder: integer("priority_order").notNull().default(0),
  
  // Completion tracking
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completionNotes: text("completion_notes"),
  actualMinutes: integer("actual_minutes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: no duplicate items per bundle
  uniqueBundleItemIndex: index("unique_bundle_item_idx").on(table.bundleId, table.maintenanceItemId),
  // Performance index for bundle queries
  bundleIdIndex: index("bundle_items_bundle_id_idx").on(table.bundleId),
}));

export const bundleWorkOrders = pgTable("bundle_work_orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id")
    .notNull()
    .references(() => maintenanceBundles.id, { onDelete: "cascade" }),
  
  // Assignment
  technicianId: varchar("technician_id").references(() => contractorProfiles.id),
  routeBatchId: varchar("route_batch_id"), // For day-of routing optimization
  
  // Operational status
  operationalStatus: text("operational_status").notNull().default("created"), // created, en_route, in_progress, completed, unable_to_complete
  
  // Day-of tracking
  arrivalTime: timestamp("arrival_time"),
  startTime: timestamp("start_time"),
  completionTime: timestamp("completion_time"),
  
  // Unable to complete tracking
  unableToCompleteReason: text("unable_to_complete_reason"),
  reasonCode: text("reason_code"), // no_access, weather, parts, etc.
  
  // Final completion
  completionNotes: text("completion_notes"),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpNotes: text("follow_up_notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for work order queries
  bundleIdIndex: index("bundle_work_orders_bundle_id_idx").on(table.bundleId),
  technicianIdIndex: index("bundle_work_orders_technician_id_idx").on(table.technicianId),
  routeBatchIndex: index("bundle_work_orders_route_batch_idx").on(table.routeBatchId),
  operationalStatusIndex: index("bundle_work_orders_status_idx").on(table.operationalStatus),
}));

export const editRequests = pgTable("edit_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id")
    .notNull()
    .references(() => maintenanceBundles.id),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),
  
  // Request details
  reason: text("reason").notNull(), // Free-text reason from member
  requestedChanges: text("requested_changes"), // What specifically they want to change
  
  // Admin response
  status: editRequestStatusEnum("status").notNull().default("pending"),
  adminResponse: text("admin_response"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  
  // Edit window management
  editWindowFields: jsonb("edit_window_fields").$type<string[]>(), // Which fields were unlocked
  editWindowExpiresAt: timestamp("edit_window_expires_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bundleAuditLogs = pgTable("bundle_audit_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id")
    .notNull()
    .references(() => maintenanceBundles.id),
  
  // State transition tracking
  fromStatus: bundleStatusEnum("from_status"),
  toStatus: bundleStatusEnum("to_status").notNull(),
  
  // Actor information
  actorId: varchar("actor_id")
    .notNull()
    .references(() => users.id),
  actorType: text("actor_type").notNull(), // member, admin, system
  
  // Change details
  reason: text("reason"),
  changedFields: jsonb("changed_fields"), // Track which fields changed
  oldValues: jsonb("old_values"), // Previous values
  newValues: jsonb("new_values"), // New values
  
  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bundleNotifications = pgTable("bundle_notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id")
    .notNull()
    .references(() => maintenanceBundles.id),
  memberId: varchar("member_id")
    .notNull()
    .references(() => memberProfiles.id),
  
  // Notification details
  notificationType: text("notification_type").notNull(), // submission_received, scheduled, confirmation_required, etc.
  channel: notificationChannelEnum("channel").notNull(),
  
  // Content
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  templateData: jsonb("template_data"), // Data used to populate template
  
  // Delivery tracking
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  
  // Status and retries
  deliveryStatus: text("delivery_status").notNull().default("pending"), // pending, sent, delivered, failed
  deliveryError: text("delivery_error"),
  retryCount: integer("retry_count").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===========================
// SCHEDULING SYSTEM TABLES
// ===========================

// Time slots for contractor availability
export const timeSlots = pgTable("time_slots", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id")
    .notNull()
    .references(() => contractorProfiles.id, { onDelete: "cascade" }),
  
  // Time slot details
  slotDate: timestamp("slot_date", { withTimezone: true }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  slotType: slotTypeEnum("slot_type").notNull().default("standard"),
  duration: slotDurationEnum("duration").notNull(),
  customDurationMinutes: integer("custom_duration_minutes"), // For custom durations
  
  // Availability and booking
  isAvailable: boolean("is_available").notNull().default(true),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringPattern: jsonb("recurring_pattern").$type<{
    frequency: "daily" | "weekly" | "monthly";
    interval: number; // Every N days/weeks/months
    daysOfWeek?: number[]; // For weekly: [1,2,3,4,5] = Mon-Fri
    endDate?: string; // When recurring pattern ends
  }>(),
  
  // Metadata
  notes: text("notes"), // Internal notes about this slot
  maxConcurrentBookings: integer("max_concurrent_bookings").notNull().default(1),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Ensure no duplicate slots for same contractor at same time
  uniqueContractorSlot: unique("unique_contractor_slot").on(
    table.contractorId, 
    table.startTime, 
    table.endTime
  ),
  // Index for quick availability queries
  contractorDateIndex: index("contractor_date_idx").on(table.contractorId, table.slotDate),
  slotTimeIndex: index("slot_time_idx").on(table.startTime, table.endTime),
}));

// Schedule conflicts detection and logging
export const scheduleConflicts = pgTable("schedule_conflicts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // Conflict details
  conflictType: conflictSeverityEnum("conflict_type").notNull(),
  workOrderId: varchar("work_order_id")
    .references(() => workOrders.id, { onDelete: "cascade" }),
  contractorId: varchar("contractor_id")
    .notNull()
    .references(() => contractorProfiles.id, { onDelete: "cascade" }),
  
  // Time range of conflict
  conflictStart: timestamp("conflict_start", { withTimezone: true }).notNull(),
  conflictEnd: timestamp("conflict_end", { withTimezone: true }).notNull(),
  
  // Conflicting entities
  conflictingWorkOrderIds: jsonb("conflicting_work_order_ids").$type<string[]>(),
  conflictingSlotIds: jsonb("conflicting_slot_ids").$type<string[]>(),
  
  // Resolution
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  adminOverride: boolean("admin_override").notNull().default(false),
  
  // Metadata
  detectionMethod: text("detection_method").notNull(), // "automatic", "manual_check", "booking_validation"
  conflictDescription: text("conflict_description").notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  contractorConflictIndex: index("contractor_conflict_idx").on(table.contractorId, table.conflictStart),
  unresolvedConflictsIndex: index("unresolved_conflicts_idx").on(table.isResolved, table.createdAt),
}));

// Schedule audit log for tracking all scheduling actions
export const scheduleAuditLog = pgTable("schedule_audit_log", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  
  // Action details
  action: auditActionEnum("action").notNull(),
  entityType: text("entity_type").notNull(), // "work_order", "time_slot", "conflict"
  entityId: varchar("entity_id").notNull(),
  
  // User context
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  userRole: userRoleEnum("user_role"),
  
  // Change details
  oldValues: jsonb("old_values"), // Previous state before change
  newValues: jsonb("new_values"), // New state after change
  changedFields: jsonb("changed_fields").$type<string[]>(), // List of fields that changed
  
  // Metadata
  reason: text("reason"), // Reason for the change
  adminOverride: boolean("admin_override").notNull().default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Context data
  additionalData: jsonb("additional_data"), // Any additional context
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  entityAuditIndex: index("entity_audit_idx").on(table.entityType, table.entityId),
  userActionIndex: index("user_action_idx").on(table.userId, table.action, table.createdAt),
  adminOverrideIndex: index("admin_override_idx").on(table.adminOverride, table.createdAt),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  username: true, // Legacy field - not used in Replit Auth
  password: true, // SECURITY: Remove password to prevent plaintext storage
  createdAt: true,
  updatedAt: true,
});

export const insertMemberProfileSchema = createInsertSchema(
  memberProfiles,
).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
});

export const insertContractorProfileSchema = createInsertSchema(
  contractorProfiles,
).omit({
  id: true,
  isVerified: true,
  verifiedAt: true,
  verifiedBy: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantProfileSchema = createInsertSchema(
  merchantProfiles,
).omit({
  id: true,
  rating: true,
  reviewCount: true,
  isVerified: true,
  verifiedAt: true,
  verifiedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHomeDetailsSchema = createInsertSchema(homeDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceRequestSchema = createInsertSchema(
  serviceRequests,
).omit({
  id: true,
  status: true,
  assignedContractorId: true,
  assignedAt: true,
  actualCompletionDate: true,
  actualDuration: true,
  finalCost: true,
  escrowStatus: true,
  membershipBenefitApplied: true,
  loyaltyDiscountApplied: true,
  completionNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  workOrderNumber: true,
  status: true,
  actualStartDate: true,
  actualEndDate: true,
  completedAt: true,
  hasSchedulingConflicts: true, // System-managed field
  conflictOverrideAt: true, // System-managed field
  createdAt: true,
  updatedAt: true,
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  estimateNumber: true,
  status: true,
  submittedAt: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  status: true,
  paidAt: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(
  calendarEvents,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// PreventiT! Bundle System Insert Schemas
export const insertMembershipTierLimitsSchema = createInsertSchema(membershipTierLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceItemSchema = createInsertSchema(maintenanceItems).omit({
  id: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceBundleSchema = createInsertSchema(maintenanceBundles).omit({
  id: true,
  itemCount: true,
  estimatedTotalMinutes: true,
  status: true,
  confirmedByMember: true,
  isAddOnPurchase: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBundleItemSchema = createInsertSchema(bundleItems).omit({
  id: true,
  priorityOrder: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
});

export const insertBundleWorkOrderSchema = createInsertSchema(bundleWorkOrders).omit({
  id: true,
  operationalStatus: true,
  followUpRequired: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEditRequestSchema = createInsertSchema(editRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
});

export const insertBundleAuditLogSchema = createInsertSchema(bundleAuditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertBundleNotificationSchema = createInsertSchema(bundleNotifications).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  deliveryStatus: true,
  retryCount: true,
  createdAt: true,
});

// ===========================
// SCHEDULING SYSTEM INSERT SCHEMAS
// ===========================

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleConflictSchema = createInsertSchema(scheduleConflicts).omit({
  id: true,
  isResolved: true, // System-managed field
  resolvedAt: true, // System-managed field
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleAuditLogSchema = createInsertSchema(scheduleAuditLog).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert; // Required for Replit Auth
export type InsertMemberProfile = z.infer<typeof insertMemberProfileSchema>;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertContractorProfile = z.infer<
  typeof insertContractorProfileSchema
>;
export type ContractorProfile = typeof contractorProfiles.$inferSelect;
export type InsertMerchantProfile = z.infer<typeof insertMerchantProfileSchema>;
export type MerchantProfile = typeof merchantProfiles.$inferSelect;
export type InsertHomeDetails = z.infer<typeof insertHomeDetailsSchema>;
export type HomeDetails = typeof homeDetails.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimates.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type LoyaltyPointTransaction =
  typeof loyaltyPointTransactions.$inferSelect;
export type DealRedemption = typeof dealRedemptions.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityGroup = typeof communityGroups.$inferSelect;

// ===========================
// SCHEDULING SYSTEM TYPE EXPORTS
// ===========================
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertScheduleConflict = z.infer<typeof insertScheduleConflictSchema>;
export type ScheduleConflict = typeof scheduleConflicts.$inferSelect;
export type InsertScheduleAuditLog = z.infer<typeof insertScheduleAuditLogSchema>;
export type ScheduleAuditLog = typeof scheduleAuditLog.$inferSelect;

// Gamification System Tables
export const badges = pgTable("badges", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Lucide icon name or custom icon path
  category: text("category").notNull(), // service_completion, loyalty, community, seasonal, etc.
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary
  pointsRequired: integer("points_required"), // Points needed to earn this badge
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ranks = pgTable("ranks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), 
  level: integer("level").notNull().unique(), // Sequential rank levels (1, 2, 3, etc.)
  pointsRequired: integer("points_required").notNull(), // Total points needed to reach this rank
  benefits: jsonb("benefits").$type<string[]>(), // Array of benefits/perks
  color: text("color").notNull().default("#6B7280"), // Hex color for rank display
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // service, social, seasonal, milestone, etc.
  type: text("type").notNull(), // one_time, recurring, progressive
  pointsAwarded: integer("points_awarded").notNull().default(0),
  badgeId: varchar("badge_id").references(() => badges.id), // Optional associated badge
  triggerCondition: jsonb("trigger_condition").$type<{
    type: string; // service_count, points_earned, days_active, etc.
    value: number;
    timeframe?: string; // daily, weekly, monthly, yearly
  }>().notNull(),
  maxProgress: integer("max_progress"), // For progressive achievements
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User Achievement/Badge Progress Tables
export const userBadges = pgTable("user_badges", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  badgeId: varchar("badge_id")
    .notNull()
    .references(() => badges.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  notified: boolean("notified").notNull().default(false),
}, (table) => {
  return {
    userBadgeUnique: unique().on(table.userId, table.badgeId),
  };
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  achievementId: varchar("achievement_id")
    .notNull()
    .references(() => achievements.id),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  lastProgressAt: timestamp("last_progress_at").notNull().defaultNow(),
  notified: boolean("notified").notNull().default(false),
}, (table) => {
  return {
    userAchievementUnique: unique().on(table.userId, table.achievementId),
  };
});

// Gamification Insert Schemas
export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRankSchema = createInsertSchema(ranks).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
  notified: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  progress: true,
  isCompleted: true,
  completedAt: true,
  lastProgressAt: true,
  notified: true,
});

// Gamification System Types
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertRank = z.infer<typeof insertRankSchema>;
export type Rank = typeof ranks.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// PreventiT! Bundle System Types
export type InsertMembershipTierLimits = z.infer<typeof insertMembershipTierLimitsSchema>;
export type MembershipTierLimits = typeof membershipTierLimits.$inferSelect;
export type InsertMaintenanceItem = z.infer<typeof insertMaintenanceItemSchema>;
export type MaintenanceItem = typeof maintenanceItems.$inferSelect;
export type InsertMaintenanceBundle = z.infer<typeof insertMaintenanceBundleSchema>;
export type MaintenanceBundle = typeof maintenanceBundles.$inferSelect;
export type InsertBundleItem = z.infer<typeof insertBundleItemSchema>;
export type BundleItem = typeof bundleItems.$inferSelect;
export type InsertBundleWorkOrder = z.infer<typeof insertBundleWorkOrderSchema>;
export type BundleWorkOrder = typeof bundleWorkOrders.$inferSelect;
export type InsertEditRequest = z.infer<typeof insertEditRequestSchema>;
export type EditRequest = typeof editRequests.$inferSelect;
export type InsertBundleAuditLog = z.infer<typeof insertBundleAuditLogSchema>;
export type BundleAuditLog = typeof bundleAuditLogs.$inferSelect;
export type InsertBundleNotification = z.infer<typeof insertBundleNotificationSchema>;
export type BundleNotification = typeof bundleNotifications.$inferSelect;

// Performance Indexes for commonly queried fields
// Note: These indexes improve query performance for frequently accessed data
