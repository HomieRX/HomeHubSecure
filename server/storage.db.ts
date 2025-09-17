import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users, memberProfiles, contractorProfiles, merchantProfiles, homeDetails,
  serviceRequests, workOrders, estimates, invoices, loyaltyPointTransactions,
  deals, dealRedemptions, messages, notifications, calendarEvents,
  communityPosts, communityGroups, badges, ranks, achievements, maintenanceItems,
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
  type CommunityGroup
} from "@shared/schema";
import { IStorage } from "./storage";

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
    let query = db.select().from(contractorProfiles);

    if (filters?.isVerified !== undefined) {
      query = query.where(eq(contractorProfiles.isVerified, filters.isVerified));
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(contractorProfiles.isActive, filters.isActive));
    }

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
    let query = db.select().from(merchantProfiles);

    if (filters?.isVerified !== undefined) {
      query = query.where(eq(merchantProfiles.isVerified, filters.isVerified));
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(merchantProfiles.isActive, filters.isActive));
    }

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

  // Transactional flow: Assign Service Request → Create Work Order
  async assignServiceRequest(id: string, homeManagerId: string): Promise<ServiceRequest | undefined> {
    return await db.transaction(async (tx) => {
      // Update the service request status and assign the home manager
      const [updatedRequest] = await tx.update(serviceRequests)
        .set({ 
          homeManagerId,
          status: "assigned"
        })
        .where(eq(serviceRequests.id, id))
        .returning();

      if (!updatedRequest) {
        throw new Error("Service request not found");
      }

      // Create a work order for the assigned service request
      await tx.insert(workOrders).values({
        serviceRequestId: id,
        contractorId: homeManagerId,
        status: "created",
        workDescription: `Work order for service request: ${updatedRequest.title}`,
        workOrderNumber: `WO-${Date.now()}`
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

  // Transactional flow: Approve Estimate → Create Invoice
  async approveEstimate(id: string): Promise<Estimate | undefined> {
    return await db.transaction(async (tx) => {
      // Update the estimate status to approved
      const [approvedEstimate] = await tx.update(estimates)
        .set(applyDefined({}, { 
          status: "approved" as const,
          respondedAt: new Date(),
          updatedAt: new Date()
        }))
        .where(eq(estimates.id, id))
        .returning();

      if (!approvedEstimate) {
        throw new Error("Estimate not found");
      }

      // Get the service request to find the member
      const [serviceRequest] = await tx.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, approvedEstimate.serviceRequestId))
        .limit(1);

      if (!serviceRequest) {
        throw new Error("Service request not found");
      }

      // Generate a unique invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create an invoice based on the approved estimate
      await tx.insert(invoices).values({
        workOrderId: "temp-work-order-id", // This needs proper work order creation
        memberId: serviceRequest.memberId,
        invoiceNumber,
        subtotal: approvedEstimate.totalCost,
        tax: "0.00",
        total: approvedEstimate.totalCost,
        amountDue: approvedEstimate.totalCost,
        lineItems: [{
          description: approvedEstimate.description,
          amount: approvedEstimate.totalCost,
          quantity: 1
        }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
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

  // Transactional flow: Pay Invoice → Status Update + Loyalty Points Ledger
  async payInvoice(id: string, paymentMethod: string, transactionId: string): Promise<Invoice | undefined> {
    return await db.transaction(async (tx) => {
      // Update the invoice status to paid
      const [paidInvoice] = await tx.update(invoices)
        .set({ 
          status: "paid",
          paymentMethod,
          transactionId,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id))
        .returning();

      if (!paidInvoice) {
        throw new Error("Invoice not found");
      }

      // Calculate loyalty points (1% of invoice amount as points)
      const loyaltyPoints = Math.floor(Number(paidInvoice.amount) * 0.01);

      // Add loyalty points to member's account (ledger entry)
      if (loyaltyPoints > 0) {
        await tx.insert(loyaltyPointTransactions).values({
          memberId: paidInvoice.memberId,
          transactionType: "earned",
          points: loyaltyPoints,
          description: `Points earned from invoice payment #${paidInvoice.id}`,
          referenceId: paidInvoice.id,
          referenceType: "invoice_payment"
        });
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
}

// Export DbStorage class for factory use