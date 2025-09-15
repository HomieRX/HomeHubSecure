import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for better type safety
export const userRoleEnum = pgEnum("user_role", ["homeowner", "contractor", "merchant", "admin"]);
export const membershipTierEnum = pgEnum("membership_tier", ["HomeHUB", "HomePRO", "HomeHERO", "HomeGURU"]);
export const serviceCategory = pgEnum("service_category", [
  "Handyman", "Dishwasher", "Oven", "Microwave", "Refrigerator", 
  "Sink Disposal", "Clothes Washer", "Clothes Dryer", "Water Heater", 
  "Basic Electrical", "Basic Irrigation", "Basic Plumbing"
]);
export const serviceRequestStatusEnum = pgEnum("service_request_status", ["pending", "assigned", "in_progress", "completed", "cancelled"]);
export const workOrderStatusEnum = pgEnum("work_order_status", ["created", "in_progress", "completed", "cancelled"]);
export const estimateStatusEnum = pgEnum("estimate_status", ["pending", "approved", "rejected", "expired"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("homeowner"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberProfiles = pgTable("member_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"), // Keep temporarily to avoid rename conflict
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  membershipTier: membershipTierEnum("membership_tier").notNull().default("HomeHUB"),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => memberProfiles.id, { onDelete: "cascade" }),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => memberProfiles.id),
  category: serviceCategory("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  urgency: text("urgency").notNull().default("normal"), // low, normal, high, emergency
  preferredDateTime: timestamp("preferred_date_time"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  images: jsonb("images").$type<string[]>(),
  status: serviceRequestStatusEnum("status").notNull().default("pending"),
  homeManagerId: varchar("home_manager_id").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  memberNotes: text("member_notes"),
  internalNotes: text("internal_notes"), // for home manager use
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().references(() => serviceRequests.id),
  homeManagerId: varchar("home_manager_id").notNull().references(() => users.id),
  contractorId: varchar("contractor_id").references(() => contractorProfiles.id),
  workOrderNumber: text("work_order_number").notNull().unique(),
  status: workOrderStatusEnum("status").notNull().default("created"),
  scheduledStartDate: timestamp("scheduled_start_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  workDescription: text("work_description").notNull(),
  materialsNeeded: jsonb("materials_needed"),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  workNotes: text("work_notes"),
  completionNotes: text("completion_notes"),
  beforeImages: jsonb("before_images").$type<string[]>(),
  afterImages: jsonb("after_images").$type<string[]>(),
  memberSignature: text("member_signature"), // digital signature
  contractorSignature: text("contractor_signature"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().references(() => serviceRequests.id),
  contractorId: varchar("contractor_id").notNull().references(() => contractorProfiles.id),
  estimateNumber: text("estimate_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  laborCost: decimal("labor_cost", { precision: 8, scale: 2 }).notNull(),
  materialCost: decimal("material_cost", { precision: 8, scale: 2 }).notNull(),
  additionalCosts: decimal("additional_costs", { precision: 8, scale: 2 }).default("0.00"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  memberId: varchar("member_id").notNull().references(() => memberProfiles.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subtotal: decimal("subtotal", { precision: 8, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 8, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 8, scale: 2 }).notNull(),
  loyaltyPointsUsed: integer("loyalty_points_used").notNull().default(0),
  loyaltyPointsValue: decimal("loyalty_points_value", { precision: 8, scale: 2 }).notNull().default("0.00"),
  amountDue: decimal("amount_due", { precision: 8, scale: 2 }).notNull(),
  loyaltyPointsEarned: integer("loyalty_points_earned").notNull().default(0),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"),
  paymentTransactionId: text("payment_transaction_id"),
  lineItems: jsonb("line_items").notNull(), // detailed breakdown of charges
  notes: text("notes"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loyaltyPointTransactions = pgTable("loyalty_point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => memberProfiles.id),
  transactionType: text("transaction_type").notNull(), // earned, spent, expired, adjusted
  points: integer("points").notNull(),
  description: text("description").notNull(),
  referenceId: varchar("reference_id"), // ID of related invoice, service, etc.
  referenceType: text("reference_type"), // invoice, service_completion, referral, etc.
  expiresAt: timestamp("expires_at"), // for earned points
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchantProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed, bogo
  discountValue: decimal("discount_value", { precision: 5, scale: 2 }).notNull(),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull().references(() => deals.id),
  memberId: varchar("member_id").notNull().references(() => memberProfiles.id),
  redemptionCode: text("redemption_code").notNull().unique(),
  usedAt: timestamp("used_at"),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  coverImage: text("cover_image"),
  memberCount: integer("member_count").notNull().default(0),
  tags: jsonb("tags").$type<string[]>(),
  location: text("location"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemberProfileSchema = createInsertSchema(memberProfiles).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
});

export const insertContractorProfileSchema = createInsertSchema(contractorProfiles).omit({
  id: true,
  isVerified: true,
  verifiedAt: true,
  verifiedBy: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantProfileSchema = createInsertSchema(merchantProfiles).omit({
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

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  status: true,
  assignedAt: true,
  actualCompletionDate: true,
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

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMemberProfile = z.infer<typeof insertMemberProfileSchema>;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertContractorProfile = z.infer<typeof insertContractorProfileSchema>;
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
export type LoyaltyPointTransaction = typeof loyaltyPointTransactions.$inferSelect;
export type DealRedemption = typeof dealRedemptions.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityGroup = typeof communityGroups.$inferSelect;