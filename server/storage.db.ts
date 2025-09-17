import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users, memberProfiles, contractorProfiles, merchantProfiles, homeDetails,
  serviceRequests, workOrders, estimates, invoices, loyaltyPointTransactions,
  deals, dealRedemptions, messages, notifications, calendarEvents,
  communityPosts, communityGroups, badges, ranks, achievements, maintenanceItems,
  // Scheduling system tables
  timeSlots, scheduleConflicts, scheduleAuditLog,
  type User, type InsertUser, type UpsertUser,
  type MemberProfile, type InsertMemberProfile,
  type ContractorProfile, type InsertContractorProfile,
  type MerchantProfile, type InsertMerchantProfile,
  type HomeDetails, type InsertHomeDetails,
  type ServiceRequest, type InsertServiceRequest,
  type WorkOrder, type InsertWorkOrder,
  type Estimate, type InsertEstimate,
  type Invoice, type InsertInvoice,
  type Deal, type InsertDeal,
  type Message, type InsertMessage,
  type Notification, type InsertNotification,
  type CalendarEvent, type InsertCalendarEvent,
  type Badge, type InsertBadge,
  type Rank, type InsertRank,
  type Achievement, type InsertAchievement,
  type MaintenanceItem, type InsertMaintenanceItem,
  type LoyaltyPointTransaction,
  type DealRedemption,
  type CommunityPost,
  type CommunityGroup,
  // Scheduling system types
  type TimeSlot, type InsertTimeSlot,
  type ScheduleConflict, type InsertScheduleConflict,
  type ScheduleAuditLog, type InsertScheduleAuditLog
} from "@shared/schema";
import { IStorage } from "./storage";

// Custom error types for transactional flows
class TransactionError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'TransactionError';
  }
}

class InvalidStatusTransitionError extends TransactionError {
  constructor(currentStatus: string, requestedStatus: string, entityType: string) {
    super(
      `Cannot transition ${entityType} from '${currentStatus}' to '${requestedStatus}'`,
      'INVALID_STATUS_TRANSITION',
      { currentStatus, requestedStatus, entityType }
    );
  }
}

class ReferentialIntegrityError extends TransactionError {
  constructor(entityType: string, id: string) {
    super(
      `Referenced ${entityType} with id '${id}' does not exist`,
      'REFERENTIAL_INTEGRITY_ERROR',
      { entityType, id }
    );
  }
}

class DuplicateOperationError extends TransactionError {
  constructor(operation: string, identifier: string) {
    super(
      `Duplicate ${operation} detected for identifier '${identifier}'`,
      'DUPLICATE_OPERATION_ERROR',
      { operation, identifier }
    );
  }
}

// Helper to merge updates without writing undefined values
function applyDefined<T>(base: T, updates: Partial<Record<keyof T, unknown>>): T {
  const result = { ...base };
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }
  return result;
}

export class DbStorage implements IStorage {
  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(applyDefined({}, updates))
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Required for Replit Auth - creates or updates user based on auth claims
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user
      const result = await db.update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userData.id))
        .returning();
      return result[0];
    } else {
      // Create new user
      const result = await db.insert(users).values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        role: userData.role || "homeowner",
        isActive: true
      }).returning();
      return result[0];
    }
  }

  // Member profiles
  async getMemberProfile(id: string): Promise<MemberProfile | undefined> {
    const result = await db.select().from(memberProfiles).where(eq(memberProfiles.id, id)).limit(1);
    return result[0];
  }

  async getMemberProfileByUserId(userId: string): Promise<MemberProfile | undefined> {
    const result = await db.select().from(memberProfiles).where(eq(memberProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createMemberProfile(profile: InsertMemberProfile): Promise<MemberProfile> {
    const result = await db.insert(memberProfiles).values(profile).returning();
    return result[0];
  }

  async updateMemberProfile(id: string, updates: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined> {
    const result = await db.update(memberProfiles)
      .set(applyDefined({}, updates))
      .where(eq(memberProfiles.id, id))
      .returning();
    return result[0];
  }

  async getMembersByTier(tier: MemberProfile['membershipTier']): Promise<MemberProfile[]> {
    return await db.select().from(memberProfiles).where(eq(memberProfiles.membershipTier, tier));
  }

  async getAllMemberProfiles(): Promise<MemberProfile[]> {
    return await db.select().from(memberProfiles).orderBy(desc(memberProfiles.joinedAt));
  }

  async deleteMemberProfile(id: string): Promise<boolean> {
    const result = await db.delete(memberProfiles).where(eq(memberProfiles.id, id)).returning();
    return result.length > 0;
  }

  // Sanitized public access methods (PII-safe)
  async getPublicContractors(filters?: { isVerified?: boolean; isActive?: boolean; specialties?: string[]; location?: string }): Promise<any[]> {
    const result = await db.select({
      id: contractorProfiles.id,
      businessName: contractorProfiles.businessName,
      specialties: contractorProfiles.specialties,
      rating: contractorProfiles.rating,
      reviewCount: contractorProfiles.reviewCount,
      yearsExperience: contractorProfiles.yearsExperience,
      isVerified: contractorProfiles.isVerified
    }).from(contractorProfiles)
    .where(and(
      ...(filters?.isVerified !== undefined ? [eq(contractorProfiles.isVerified, filters.isVerified)] : []),
      ...(filters?.isActive !== undefined ? [eq(contractorProfiles.isActive, filters.isActive)] : [])
    ));

    return result;
  }

  async getPublicMerchants(filters?: { isVerified?: boolean; isActive?: boolean; businessType?: string; location?: string }): Promise<any[]> {
    const result = await db.select({
      id: merchantProfiles.id,
      businessName: merchantProfiles.businessName,
      businessType: merchantProfiles.businessType,
      businessDescription: merchantProfiles.businessDescription,
      isVerified: merchantProfiles.isVerified
    }).from(merchantProfiles)
    .where(and(
      ...(filters?.isVerified !== undefined ? [eq(merchantProfiles.isVerified, filters.isVerified)] : []),
      ...(filters?.isActive !== undefined ? [eq(merchantProfiles.isActive, filters.isActive)] : [])
    ));

    return result;
  }

  async getPublicMembersByTier(tier: MemberProfile['membershipTier']): Promise<any[]> {
    return await db.select({
      id: memberProfiles.id,
      nickname: memberProfiles.nickname,
      membershipTier: memberProfiles.membershipTier,
      joinedAt: memberProfiles.joinedAt
    }).from(memberProfiles).where(eq(memberProfiles.membershipTier, tier));
  }

  // Contractor profiles
  async getContractorProfile(id: string): Promise<ContractorProfile | undefined> {
    const result = await db.select().from(contractorProfiles).where(eq(contractorProfiles.id, id)).limit(1);
    return result[0];
  }

  async getContractorProfileByUserId(userId: string): Promise<ContractorProfile | undefined> {
    const result = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createContractorProfile(profile: InsertContractorProfile): Promise<ContractorProfile> {
    const result = await db.insert(contractorProfiles).values(profile).returning();
    return result[0];
  }

  async updateContractorProfile(id: string, updates: Partial<InsertContractorProfile>): Promise<ContractorProfile | undefined> {
    const result = await db.update(contractorProfiles)
      .set(applyDefined({}, updates))
      .where(eq(contractorProfiles.id, id))
      .returning();
    return result[0];
  }

  async getContractors(filters?: { isVerified?: boolean; isActive?: boolean; specialties?: string[]; location?: string }): Promise<ContractorProfile[]> {
    const conditions = [];
    
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(contractorProfiles.isVerified, filters.isVerified));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(contractorProfiles.isActive, filters.isActive));
    }

    const query = conditions.length > 0 
      ? db.select().from(contractorProfiles).where(and(...conditions))
      : db.select().from(contractorProfiles);

    return await query;
  }

  async verifyContractor(id: string, verifiedBy: string): Promise<ContractorProfile | undefined> {
    const result = await db.update(contractorProfiles)
      .set({ 
        isVerified: true, 
        verifiedBy, 
        verifiedAt: new Date()
      })
      .where(eq(contractorProfiles.id, id))
      .returning();
    return result[0];
  }

  async getAllContractorProfiles(): Promise<ContractorProfile[]> {
    return await db.select().from(contractorProfiles).orderBy(desc(contractorProfiles.createdAt));
  }

  async deleteContractorProfile(id: string): Promise<boolean> {
    const result = await db.delete(contractorProfiles).where(eq(contractorProfiles.id, id)).returning();
    return result.length > 0;
  }

  // Merchant profiles
  async getMerchantProfile(id: string): Promise<MerchantProfile | undefined> {
    const result = await db.select().from(merchantProfiles).where(eq(merchantProfiles.id, id)).limit(1);
    return result[0];
  }

  async getMerchantProfileByUserId(userId: string): Promise<MerchantProfile | undefined> {
    const result = await db.select().from(merchantProfiles).where(eq(merchantProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createMerchantProfile(profile: InsertMerchantProfile): Promise<MerchantProfile> {
    const result = await db.insert(merchantProfiles).values(profile).returning();
    return result[0];
  }

  async updateMerchantProfile(id: string, updates: Partial<InsertMerchantProfile>): Promise<MerchantProfile | undefined> {
    const result = await db.update(merchantProfiles)
      .set(applyDefined({}, updates))
      .where(eq(merchantProfiles.id, id))
      .returning();
    return result[0];
  }

  async getMerchants(filters?: { isVerified?: boolean; isActive?: boolean; businessType?: string; location?: string }): Promise<MerchantProfile[]> {
    const conditions = [];
    
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(merchantProfiles.isVerified, filters.isVerified));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(merchantProfiles.isActive, filters.isActive));
    }

    const query = conditions.length > 0 
      ? db.select().from(merchantProfiles).where(and(...conditions))
      : db.select().from(merchantProfiles);

    return await query;
  }

  async getAllMerchantProfiles(): Promise<MerchantProfile[]> {
    return await db.select().from(merchantProfiles).orderBy(desc(merchantProfiles.createdAt));
  }

  async deleteMerchantProfile(id: string): Promise<boolean> {
    const result = await db.delete(merchantProfiles).where(eq(merchantProfiles.id, id)).returning();
    return result.length > 0;
  }

  // Home details
  async getHomeDetails(id: string): Promise<HomeDetails | undefined> {
    const result = await db.select().from(homeDetails).where(eq(homeDetails.id, id)).limit(1);
    return result[0];
  }

  async getHomeDetailsByProfileId(profileId: string): Promise<HomeDetails | undefined> {
    const result = await db.select().from(homeDetails).where(eq(homeDetails.profileId, profileId)).limit(1);
    return result[0];
  }

  async createHomeDetails(details: InsertHomeDetails): Promise<HomeDetails> {
    const result = await db.insert(homeDetails).values(details).returning();
    return result[0];
  }

  async updateHomeDetails(id: string, updates: Partial<InsertHomeDetails>): Promise<HomeDetails | undefined> {
    const result = await db.update(homeDetails)
      .set(applyDefined({}, updates))
      .where(eq(homeDetails.id, id))
      .returning();
    return result[0];
  }

  // Service requests
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const result = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
    return result[0];
  }

  async getServiceRequestsByMember(memberId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests)
      .where(eq(serviceRequests.memberId, memberId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequestsByManager(homeManagerId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests)
      .where(eq(serviceRequests.homeManagerId, homeManagerId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const result = await db.insert(serviceRequests).values(request).returning();
    return result[0];
  }

  async updateServiceRequest(id: string, updates: Partial<InsertServiceRequest>): Promise<ServiceRequest | undefined> {
    const result = await db.update(serviceRequests)
      .set(updates)
      .where(eq(serviceRequests.id, id))
      .returning();
    return result[0];
  }

  // Transactional flow: Assign Service Request → Create Work Order (Hardened)
  async assignServiceRequest(id: string, homeManagerId: string): Promise<ServiceRequest | undefined> {
    return await db.transaction(async (tx) => {
      // First, check if service request exists and is in pending status
      const [currentRequest] = await tx.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, id))
        .limit(1);

      if (!currentRequest) {
        throw new ReferentialIntegrityError("service_request", id);
      }

      // Status guard: only allow pending → assigned transition
      if (currentRequest.status !== "pending") {
        throw new InvalidStatusTransitionError(
          currentRequest.status, 
          "assigned", 
          "service_request"
        );
      }

      // Verify the home manager/contractor exists and is active
      const [manager] = await tx.select()
        .from(users)
        .where(and(
          eq(users.id, homeManagerId),
          eq(users.isActive, true)
        ))
        .limit(1);

      if (!manager) {
        throw new ReferentialIntegrityError("user/manager", homeManagerId);
      }

      // Additional check: verify the user has appropriate role (contractor or admin)
      if (!["contractor", "admin"].includes(manager.role)) {
        throw new TransactionError(
          `User with role '${manager.role}' cannot be assigned as home manager`,
          "INVALID_ROLE_ASSIGNMENT",
          { userId: homeManagerId, role: manager.role }
        );
      }

      // Check if a work order already exists for this service request to prevent duplicates
      const existingWorkOrders = await tx.select()
        .from(workOrders)
        .where(eq(workOrders.serviceRequestId, id))
        .limit(1);

      if (existingWorkOrders.length > 0) {
        throw new DuplicateOperationError("work order creation", id);
      }

      // Update the service request with WHERE clause guard for atomic assignment
      const [updatedRequest] = await tx.update(serviceRequests)
        .set({ 
          homeManagerId,
          status: "assigned",
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(serviceRequests.id, id),
          eq(serviceRequests.status, "pending") // Additional guard at DB level
        ))
        .returning();

      if (!updatedRequest) {
        throw new InvalidStatusTransitionError("pending", "assigned", "service_request");
      }

      // Generate unique work order number
      const workOrderNumber = `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a work order for the assigned service request
      await tx.insert(workOrders).values({
        serviceRequestId: id,
        contractorId: homeManagerId,
        status: "created",
        workDescription: `Work order for service request: ${updatedRequest.title}`,
        workOrderNumber,
        scheduledStartDate: updatedRequest.preferredDateTime || null,
        estimatedDuration: updatedRequest.estimatedDuration || null
      });

      return updatedRequest;
    });
  }

  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  }

  async deleteServiceRequest(id: string): Promise<boolean> {
    const result = await db.delete(serviceRequests).where(eq(serviceRequests.id, id)).returning();
    return result.length > 0;
  }

  // Work orders
  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const result = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
    return result[0];
  }

  async getWorkOrdersByServiceRequest(serviceRequestId: string): Promise<WorkOrder[]> {
    return await db.select().from(workOrders)
      .where(eq(workOrders.serviceRequestId, serviceRequestId))
      .orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrdersByManager(homeManagerId: string): Promise<WorkOrder[]> {
    return await db.select().from(workOrders)
      .where(eq(workOrders.contractorId, homeManagerId))
      .orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrdersByContractor(contractorId: string): Promise<WorkOrder[]> {
    return await db.select().from(workOrders)
      .where(eq(workOrders.contractorId, contractorId))
      .orderBy(desc(workOrders.createdAt));
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const result = await db.insert(workOrders).values(workOrder).returning();
    return result[0];
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const result = await db.update(workOrders)
      .set(updates)
      .where(eq(workOrders.id, id))
      .returning();
    return result[0];
  }

  async completeWorkOrder(id: string, completionNotes: string): Promise<WorkOrder | undefined> {
    const result = await db.update(workOrders)
      .set({ 
        status: "completed",
        completionNotes,
        completedAt: new Date()
      })
      .where(eq(workOrders.id, id))
      .returning();
    return result[0];
  }

  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
  }

  async deleteWorkOrder(id: string): Promise<boolean> {
    const result = await db.delete(workOrders).where(eq(workOrders.id, id)).returning();
    return result.length > 0;
  }

  // Estimates
  async getEstimate(id: string): Promise<Estimate | undefined> {
    const result = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
    return result[0];
  }

  async getEstimatesByServiceRequest(serviceRequestId: string): Promise<Estimate[]> {
    return await db.select().from(estimates)
      .where(eq(estimates.serviceRequestId, serviceRequestId))
      .orderBy(desc(estimates.createdAt));
  }

  async getEstimatesByContractor(contractorId: string): Promise<Estimate[]> {
    return await db.select().from(estimates)
      .where(eq(estimates.contractorId, contractorId))
      .orderBy(desc(estimates.createdAt));
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const result = await db.insert(estimates).values({
      ...estimate,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const result = await db.update(estimates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(estimates.id, id))
      .returning();
    return result[0];
  }

  // Transactional flow: Approve Estimate → Create Invoice (Hardened)
  async approveEstimate(id: string): Promise<Estimate | undefined> {
    return await db.transaction(async (tx) => {
      // First, check if estimate exists and is in pending status
      const [currentEstimate] = await tx.select()
        .from(estimates)
        .where(eq(estimates.id, id))
        .limit(1);

      if (!currentEstimate) {
        throw new ReferentialIntegrityError("estimate", id);
      }

      // Status guard: only allow pending → approved transition
      if (currentEstimate.status !== "pending") {
        throw new InvalidStatusTransitionError(
          currentEstimate.status, 
          "approved", 
          "estimate"
        );
      }

      // Check if an invoice already exists for this estimate using proper FK (SECURITY FIX)
      const existingInvoices = await tx.select()
        .from(invoices)
        .where(eq(invoices.estimateId, id))
        .limit(1);

      if (existingInvoices.length > 0) {
        throw new DuplicateOperationError("invoice creation", id);
      }

      // RACE CONDITION FIX: Do status transition first, then work order creation
      // Update the estimate status to approved with WHERE clause guard
      const [approvedEstimate] = await tx.update(estimates)
        .set({ 
          status: "approved" as const,
          respondedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(estimates.id, id),
          eq(estimates.status, "pending") // Additional guard at DB level
        ))
        .returning();

      if (!approvedEstimate) {
        throw new InvalidStatusTransitionError("pending", "approved", "estimate");
      }

      // Get the service request and verify it exists
      const [serviceRequest] = await tx.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, currentEstimate.serviceRequestId))
        .limit(1);

      if (!serviceRequest) {
        throw new ReferentialIntegrityError("service_request", currentEstimate.serviceRequestId);
      }

      // Find or create a work order for this service request with ON CONFLICT handling
      let [workOrder] = await tx.select()
        .from(workOrders)
        .where(eq(workOrders.serviceRequestId, currentEstimate.serviceRequestId))
        .limit(1);

      if (!workOrder) {
        // Create work order if it doesn't exist (DB unique constraint will prevent duplicates)
        try {
          [workOrder] = await tx.insert(workOrders).values({
            serviceRequestId: currentEstimate.serviceRequestId,
            contractorId: currentEstimate.contractorId,
            status: "created",
            workDescription: `Work order for estimate: ${currentEstimate.title}`,
            workOrderNumber: `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }).returning();
        } catch (error: any) {
          // Handle potential race condition where work order was created by another transaction
          if (error.code === '23505') { // PostgreSQL unique constraint violation
            [workOrder] = await tx.select()
              .from(workOrders)
              .where(eq(workOrders.serviceRequestId, currentEstimate.serviceRequestId))
              .limit(1);
          } else {
            throw error;
          }
        }
      }

      // Generate a unique invoice number with timestamp and random component
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create an invoice based on the approved estimate using new FK structure
      await tx.insert(invoices).values({
        estimateId: approvedEstimate.id, // Direct FK reference (SECURITY FIX)
        memberId: serviceRequest.memberId,
        invoiceNumber,
        subtotal: approvedEstimate.totalCost,
        tax: "0.00", // TODO: Calculate tax based on location
        total: approvedEstimate.totalCost,
        amountDue: approvedEstimate.totalCost,
        lineItems: [{
          description: approvedEstimate.description,
          amount: approvedEstimate.totalCost,
          quantity: 1,
          referenceId: approvedEstimate.id, // Keep for compatibility
          referenceType: "estimate"
        }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "sent" // Ready for payment
      });

      return approvedEstimate;
    });
  }

  async rejectEstimate(id: string): Promise<Estimate | undefined> {
    const result = await db.update(estimates)
      .set({ 
        status: "rejected",
        rejectedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(estimates.id, id))
      .returning();
    return result[0];
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return await db.select().from(estimates).orderBy(desc(estimates.createdAt));
  }

  async deleteEstimate(id: string): Promise<boolean> {
    const result = await db.delete(estimates).where(eq(estimates.id, id)).returning();
    return result.length > 0;
  }

  // Invoices
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoicesByMember(memberId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.memberId, memberId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByWorkOrder(workOrderId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.workOrderId, workOrderId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values({
      ...invoice,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  // Transactional flow: Pay Invoice → Status Update + Loyalty Points Ledger (Hardened)
  async payInvoice(id: string, paymentMethod: string, transactionId: string): Promise<Invoice | undefined> {
    return await db.transaction(async (tx) => {
      // First, check if invoice exists and is in payable status
      const [currentInvoice] = await tx.select()
        .from(invoices)
        .where(eq(invoices.id, id))
        .limit(1);

      if (!currentInvoice) {
        throw new ReferentialIntegrityError("invoice", id);
      }

      // Status guard: only allow sent → paid transition
      if (currentInvoice.status !== "sent") {
        throw new InvalidStatusTransitionError(
          currentInvoice.status, 
          "paid", 
          "invoice"
        );
      }

      // RACE CONDITION FIX: Atomic check for existing payment with same transaction
      const existingPayment = await tx.select()
        .from(invoices)
        .where(eq(invoices.transactionId, transactionId))
        .limit(1);

      if (existingPayment.length > 0) {
        if (existingPayment[0].id === id && existingPayment[0].status === "paid") {
          // Same invoice, same transaction - return existing result (idempotent)
          return existingPayment[0];
        } else {
          // Different invoice or invalid state - conflict
          throw new DuplicateOperationError("payment transaction", transactionId);
        }
      }

      // Atomic update with comprehensive WHERE clause for race condition protection
      const [paidInvoice] = await tx.update(invoices)
        .set({ 
          status: "paid",
          paymentMethod,
          transactionId,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(invoices.id, id),
          eq(invoices.status, "sent"), // Status guard
          sql`transaction_id IS NULL` // Ensure not already paid (race protection)
        ))
        .returning();

      if (!paidInvoice) {
        // Could be due to race condition or invalid status - check what happened
        const [currentState] = await tx.select()
          .from(invoices)
          .where(eq(invoices.id, id))
          .limit(1);
        
        if (currentState?.status === "paid") {
          throw new DuplicateOperationError("invoice payment", id);
        } else {
          throw new InvalidStatusTransitionError(currentState?.status || "unknown", "paid", "invoice");
        }
      }

      // Calculate loyalty points (1% of invoice total, not amount)
      const invoiceTotal = Number(paidInvoice.total);
      const loyaltyPoints = Math.floor(invoiceTotal * 0.01);

      // Verify member exists before adding loyalty points
      const [member] = await tx.select()
        .from(memberProfiles)
        .where(eq(memberProfiles.id, paidInvoice.memberId))
        .limit(1);

      if (!member) {
        throw new ReferentialIntegrityError("member_profile", paidInvoice.memberId);
      }

      // Add loyalty points to member's account (ledger entry) - only if points > 0
      if (loyaltyPoints > 0) {
        await tx.insert(loyaltyPointTransactions).values({
          memberId: paidInvoice.memberId,
          transactionType: "earned",
          points: loyaltyPoints,
          description: `Points earned from invoice payment #${paidInvoice.invoiceNumber}`,
          referenceId: paidInvoice.id,
          referenceType: "invoice_payment"
        });

        // Update member's loyalty points balance
        await tx.update(memberProfiles)
          .set({
            loyaltyPoints: sql`${memberProfiles.loyaltyPoints} + ${loyaltyPoints}`,
            updatedAt: new Date()
          })
          .where(eq(memberProfiles.id, paidInvoice.memberId));
      }

      return paidInvoice;
    });
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }

  // Loyalty points
  async getLoyaltyPointBalance(memberId: string): Promise<number> {
    const result = await db.select({
      balance: sql<number>`COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN points ELSE -points END), 0)`
    })
    .from(loyaltyPointTransactions)
    .where(eq(loyaltyPointTransactions.memberId, memberId));
    
    return result[0]?.balance || 0;
  }

  async getLoyaltyPointTransactions(memberId: string): Promise<LoyaltyPointTransaction[]> {
    return await db.select().from(loyaltyPointTransactions)
      .where(eq(loyaltyPointTransactions.memberId, memberId))
      .orderBy(desc(loyaltyPointTransactions.createdAt));
  }

  async addLoyaltyPoints(memberId: string, points: number, description: string, referenceId?: string, referenceType?: string): Promise<LoyaltyPointTransaction> {
    const result = await db.insert(loyaltyPointTransactions).values({
      memberId: memberId,
      points,
      transactionType: "earned",
      description,
      referenceId,
      referenceType
    }).returning();
    return result[0];
  }

  async spendLoyaltyPoints(memberId: string, points: number, description: string, referenceId?: string, referenceType?: string): Promise<LoyaltyPointTransaction> {
    const result = await db.insert(loyaltyPointTransactions).values({
      memberId: memberId,
      points,
      transactionType: "spent",
      description,
      referenceId,
      referenceType
    }).returning();
    return result[0];
  }

  // Deals
  async getDeal(id: string): Promise<Deal | undefined> {
    const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
    return result[0];
  }

  async getDealsByMerchant(merchantId: string): Promise<Deal[]> {
    return await db.select().from(deals)
      .where(eq(deals.merchantId, merchantId))
      .orderBy(desc(deals.createdAt));
  }

  async getActiveDeals(filters?: { category?: string; membershipRequired?: string; isExclusive?: boolean }): Promise<Deal[]> {
    let query = db.select().from(deals)
      .where(and(
        eq(deals.isActive, true),
        sql`${deals.validFrom} <= NOW()`,
        sql`${deals.validUntil} >= NOW()`
      ));

    return await query.orderBy(desc(deals.createdAt));
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const result = await db.insert(deals).values({
      ...deal,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const result = await db.update(deals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return result[0];
  }

  async redeemDeal(dealId: string, memberId: string): Promise<DealRedemption> {
    const result = await db.insert(dealRedemptions).values({
      dealId,
      memberId: memberId,
      redemptionCode: `RDM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usedAt: new Date(),
      isUsed: true
    }).returning();
    return result[0];
  }

  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async deleteDeal(id: string): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id)).returning();
    return result.length > 0;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`)
      .orderBy(desc(messages.sentAt));
  }

  async getConversation(senderId: string, receiverId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(sql`(${messages.senderId} = ${senderId} AND ${messages.receiverId} = ${receiverId}) OR (${messages.senderId} = ${receiverId} AND ${messages.receiverId} = ${senderId})`)
      .orderBy(messages.sentAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...message,
      sentAt: new Date()
    }).returning();
    return result[0];
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.sentAt));
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values({
      ...notification,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Calendar events
  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const result = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
    return result[0];
  }

  async getCalendarEventsByUser(userId: string): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents)
      .where(eq(calendarEvents.userId, userId))
      .orderBy(calendarEvents.startTime);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const result = await db.insert(calendarEvents).values({
      ...event,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const result = await db.update(calendarEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return result[0];
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id)).returning();
    return result.length > 0;
  }

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).orderBy(calendarEvents.startTime);
  }

  // Community
  async getCommunityPosts(limit = 50, offset = 0): Promise<CommunityPost[]> {
    return await db.select().from(communityPosts)
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCommunityPost(id: string): Promise<CommunityPost | undefined> {
    const result = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
    return result[0];
  }

  async createCommunityPost(authorId: string, content: string, images?: string[], tags?: string[]): Promise<CommunityPost> {
    const result = await db.insert(communityPosts).values({
      authorId,
      content,
      images: images || [],
      tags: tags || [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getCommunityGroups(): Promise<CommunityGroup[]> {
    return await db.select().from(communityGroups).orderBy(desc(communityGroups.createdAt));
  }

  async getCommunityGroup(id: string): Promise<CommunityGroup | undefined> {
    const result = await db.select().from(communityGroups).where(eq(communityGroups.id, id)).limit(1);
    return result[0];
  }

  async createCommunityGroup(name: string, description: string, category: string, createdBy: string): Promise<CommunityGroup> {
    const result = await db.insert(communityGroups).values({
      name,
      description,
      category,
      createdBy,
      memberCount: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  // Gamification - Badges
  async getBadge(id: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return result[0];
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(desc(badges.createdAt));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values({
      ...badge,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge | undefined> {
    const result = await db.update(badges)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(badges.id, id))
      .returning();
    return result[0];
  }

  async deleteBadge(id: string): Promise<boolean> {
    const result = await db.delete(badges).where(eq(badges.id, id)).returning();
    return result.length > 0;
  }

  // Gamification - Ranks
  async getRank(id: string): Promise<Rank | undefined> {
    const result = await db.select().from(ranks).where(eq(ranks.id, id)).limit(1);
    return result[0];
  }

  async getAllRanks(): Promise<Rank[]> {
    return await db.select().from(ranks).orderBy(ranks.level);
  }

  async createRank(rank: InsertRank): Promise<Rank> {
    const result = await db.insert(ranks).values({
      ...rank,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateRank(id: string, updates: Partial<InsertRank>): Promise<Rank | undefined> {
    const result = await db.update(ranks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ranks.id, id))
      .returning();
    return result[0];
  }

  async deleteRank(id: string): Promise<boolean> {
    const result = await db.delete(ranks).where(eq(ranks.id, id)).returning();
    return result.length > 0;
  }

  // Gamification - Achievements
  async getAchievement(id: string): Promise<Achievement | undefined> {
    const result = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
    return result[0];
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(desc(achievements.createdAt));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const result = await db.insert(achievements).values({
      ...achievement,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateAchievement(id: string, updates: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const result = await db.update(achievements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(achievements.id, id))
      .returning();
    return result[0];
  }

  async deleteAchievement(id: string): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id)).returning();
    return result.length > 0;
  }

  // Maintenance Items
  async getMaintenanceItem(id: string): Promise<MaintenanceItem | undefined> {
    const result = await db.select().from(maintenanceItems).where(eq(maintenanceItems.id, id)).limit(1);
    return result[0];
  }

  async getAllMaintenanceItems(): Promise<MaintenanceItem[]> {
    return await db.select().from(maintenanceItems).orderBy(maintenanceItems.name);
  }

  async createMaintenanceItem(item: InsertMaintenanceItem): Promise<MaintenanceItem> {
    const result = await db.insert(maintenanceItems).values({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateMaintenanceItem(id: string, updates: Partial<InsertMaintenanceItem>): Promise<MaintenanceItem | undefined> {
    const result = await db.update(maintenanceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceItems.id, id))
      .returning();
    return result[0];
  }

  async deleteMaintenanceItem(id: string): Promise<boolean> {
    const result = await db.delete(maintenanceItems).where(eq(maintenanceItems.id, id)).returning();
    return result.length > 0;
  }

  // ===========================
  // SCHEDULING SYSTEM METHODS
  // ===========================

  // Time slot management
  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const result = await db.select().from(timeSlots).where(eq(timeSlots.id, id)).limit(1);
    return result[0];
  }

  async getContractorTimeSlots(contractorId: string, startDate?: Date, endDate?: Date): Promise<TimeSlot[]> {
    let query = db.select().from(timeSlots).where(eq(timeSlots.contractorId, contractorId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(timeSlots.contractorId, contractorId),
          sql`${timeSlots.slotDate} >= ${startDate.toISOString()}::timestamp`,
          sql`${timeSlots.slotDate} <= ${endDate.toISOString()}::timestamp`
        )
      );
    } else if (startDate) {
      query = query.where(
        and(
          eq(timeSlots.contractorId, contractorId),
          sql`${timeSlots.slotDate} >= ${startDate.toISOString()}::timestamp`
        )
      );
    } else if (endDate) {
      query = query.where(
        and(
          eq(timeSlots.contractorId, contractorId),
          sql`${timeSlots.slotDate} <= ${endDate.toISOString()}::timestamp`
        )
      );
    }

    return await query.orderBy(timeSlots.startTime);
  }

  async getOverlappingTimeSlots(contractorId: string, startTime: Date, endTime: Date): Promise<TimeSlot[]> {
    return await db.select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.contractorId, contractorId),
          // Check for time overlaps using PostgreSQL OVERLAPS operator
          sql`(${timeSlots.startTime}, ${timeSlots.endTime}) OVERLAPS (${startTime.toISOString()}::timestamp, ${endTime.toISOString()}::timestamp)`
        )
      )
      .orderBy(timeSlots.startTime);
  }

  async createTimeSlot(slot: InsertTimeSlot): Promise<TimeSlot> {
    const result = await db.insert(timeSlots).values(slot).returning();
    return result[0];
  }

  async updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const result = await db.update(timeSlots)
      .set(applyDefined({ updatedAt: new Date() }, updates))
      .where(eq(timeSlots.id, id))
      .returning();
    return result[0];
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    const result = await db.delete(timeSlots).where(eq(timeSlots.id, id)).returning();
    return result.length > 0;
  }

  // Work order scheduling queries
  async getOverlappingWorkOrders(contractorId: string, startTime: Date, endTime: Date): Promise<WorkOrder[]> {
    return await db.select()
      .from(workOrders)
      .where(
        and(
          eq(workOrders.contractorId, contractorId),
          sql`${workOrders.scheduledStartDate} IS NOT NULL`,
          sql`${workOrders.scheduledEndDate} IS NOT NULL`,
          // Check for time overlaps using PostgreSQL OVERLAPS operator
          sql`(${workOrders.scheduledStartDate}, ${workOrders.scheduledEndDate}) OVERLAPS (${startTime.toISOString()}::timestamp, ${endTime.toISOString()}::timestamp)`
        )
      )
      .orderBy(workOrders.scheduledStartDate);
  }

  async getWorkOrdersByDateRange(contractorId: string, startDate: Date, endDate: Date): Promise<WorkOrder[]> {
    return await db.select()
      .from(workOrders)
      .where(
        and(
          eq(workOrders.contractorId, contractorId),
          sql`${workOrders.scheduledStartDate} IS NOT NULL`,
          sql`${workOrders.scheduledStartDate} >= ${startDate.toISOString()}::timestamp`,
          sql`${workOrders.scheduledStartDate} <= ${endDate.toISOString()}::timestamp`
        )
      )
      .orderBy(workOrders.scheduledStartDate);
  }

  // Schedule conflict management
  async getScheduleConflict(id: string): Promise<ScheduleConflict | undefined> {
    const result = await db.select().from(scheduleConflicts).where(eq(scheduleConflicts.id, id)).limit(1);
    return result[0];
  }

  async getScheduleConflictsByWorkOrder(workOrderId: string): Promise<ScheduleConflict[]> {
    return await db.select()
      .from(scheduleConflicts)
      .where(eq(scheduleConflicts.workOrderId, workOrderId))
      .orderBy(desc(scheduleConflicts.createdAt));
  }

  async getScheduleConflictsByContractor(contractorId: string, includeResolved = false): Promise<ScheduleConflict[]> {
    let query = db.select().from(scheduleConflicts).where(eq(scheduleConflicts.contractorId, contractorId));
    
    if (!includeResolved) {
      query = query.where(
        and(
          eq(scheduleConflicts.contractorId, contractorId),
          eq(scheduleConflicts.isResolved, false)
        )
      );
    }

    return await query.orderBy(desc(scheduleConflicts.createdAt));
  }

  async createScheduleConflict(conflict: InsertScheduleConflict): Promise<ScheduleConflict> {
    const result = await db.insert(scheduleConflicts).values(conflict).returning();
    return result[0];
  }

  async updateScheduleConflict(id: string, updates: Partial<InsertScheduleConflict>): Promise<ScheduleConflict | undefined> {
    const result = await db.update(scheduleConflicts)
      .set(applyDefined({ updatedAt: new Date() }, updates))
      .where(eq(scheduleConflicts.id, id))
      .returning();
    return result[0];
  }

  async resolveScheduleConflict(id: string, resolvedBy: string, resolutionNotes: string): Promise<ScheduleConflict | undefined> {
    const result = await db.update(scheduleConflicts)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes,
        updatedAt: new Date()
      })
      .where(eq(scheduleConflicts.id, id))
      .returning();
    return result[0];
  }

  // Schedule audit logging
  async getScheduleAuditLog(id: string): Promise<ScheduleAuditLog | undefined> {
    const result = await db.select().from(scheduleAuditLog).where(eq(scheduleAuditLog.id, id)).limit(1);
    return result[0];
  }

  async getScheduleAuditLogsByEntity(entityType: string, entityId: string): Promise<ScheduleAuditLog[]> {
    return await db.select()
      .from(scheduleAuditLog)
      .where(
        and(
          eq(scheduleAuditLog.entityType, entityType),
          eq(scheduleAuditLog.entityId, entityId)
        )
      )
      .orderBy(desc(scheduleAuditLog.createdAt));
  }

  async getScheduleAuditLogsByUser(userId: string, limit = 50): Promise<ScheduleAuditLog[]> {
    return await db.select()
      .from(scheduleAuditLog)
      .where(eq(scheduleAuditLog.userId, userId))
      .orderBy(desc(scheduleAuditLog.createdAt))
      .limit(limit);
  }

  async createScheduleAuditLog(auditEntry: InsertScheduleAuditLog): Promise<ScheduleAuditLog> {
    const result = await db.insert(scheduleAuditLog).values(auditEntry).returning();
    return result[0];
  }
}

// Export error types for use in other modules
export {
  TransactionError,
  InvalidStatusTransitionError,
  ReferentialIntegrityError,
  DuplicateOperationError
};

// Export DbStorage class for factory use