import { 
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
  type NotificationSettings, type InsertNotificationSettings,
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
  type ScheduleAuditLog, type InsertScheduleAuditLog,
  // Forum system types
  type Forum, type InsertForum,
  type ForumTopic, type InsertForumTopic,
  type ForumPost, type InsertForumPost,
  type ForumPostVote, type InsertForumPostVote
} from "@shared/schema";
import { randomUUID } from "crypto";
import { seedComprehensiveData as seedComprehensiveDataFunction } from "./comprehensiveSeed";

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

// Comprehensive storage interface for all HomeHub business models
export interface IStorage {
  // User management (IMPORTANT: Required methods for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>; // For admin bootstrap mechanism
  upsertUser(user: UpsertUser): Promise<User>; // Required for Replit Auth
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Member profiles
  getMemberProfile(id: string): Promise<MemberProfile | undefined>;
  getMemberProfileByUserId(userId: string): Promise<MemberProfile | undefined>;
  createMemberProfile(profile: InsertMemberProfile): Promise<MemberProfile>;
  updateMemberProfile(id: string, updates: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined>;
  getMembersByTier(tier: string): Promise<MemberProfile[]>;
  getAllMemberProfiles(): Promise<MemberProfile[]>;
  deleteMemberProfile(id: string): Promise<boolean>;
  
  // Sanitized public access methods (PII-safe)
  getPublicContractors(filters?: { isVerified?: boolean; isActive?: boolean; specialties?: string[]; location?: string }): Promise<any[]>;
  getPublicMerchants(filters?: { isVerified?: boolean; isActive?: boolean; businessType?: string; location?: string }): Promise<any[]>;
  getPublicMembersByTier(tier: string): Promise<any[]>;
  
  // Contractor profiles
  getContractorProfile(id: string): Promise<ContractorProfile | undefined>;
  getContractorProfileByUserId(userId: string): Promise<ContractorProfile | undefined>;
  createContractorProfile(profile: InsertContractorProfile): Promise<ContractorProfile>;
  updateContractorProfile(id: string, updates: Partial<InsertContractorProfile>): Promise<ContractorProfile | undefined>;
  getContractors(filters?: { isVerified?: boolean; isActive?: boolean; specialties?: string[]; location?: string }): Promise<ContractorProfile[]>;
  verifyContractor(id: string, verifiedBy: string): Promise<ContractorProfile | undefined>;
  getAllContractorProfiles(): Promise<ContractorProfile[]>;
  deleteContractorProfile(id: string): Promise<boolean>;
  
  // Merchant profiles
  getMerchantProfile(id: string): Promise<MerchantProfile | undefined>;
  getMerchantProfileByUserId(userId: string): Promise<MerchantProfile | undefined>;
  createMerchantProfile(profile: InsertMerchantProfile): Promise<MerchantProfile>;
  updateMerchantProfile(id: string, updates: Partial<InsertMerchantProfile>): Promise<MerchantProfile | undefined>;
  getMerchants(filters?: { isVerified?: boolean; isActive?: boolean; businessType?: string; location?: string }): Promise<MerchantProfile[]>;
  getAllMerchantProfiles(): Promise<MerchantProfile[]>;
  deleteMerchantProfile(id: string): Promise<boolean>;
  
  // Home details
  getHomeDetails(id: string): Promise<HomeDetails | undefined>;
  getHomeDetailsByProfileId(profileId: string): Promise<HomeDetails | undefined>;
  createHomeDetails(details: InsertHomeDetails): Promise<HomeDetails>;
  updateHomeDetails(id: string, updates: Partial<InsertHomeDetails>): Promise<HomeDetails | undefined>;
  
  // Service requests
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestsByMember(memberId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByManager(homeManagerId: string): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, updates: Partial<InsertServiceRequest>): Promise<ServiceRequest | undefined>;
  assignServiceRequest(id: string, homeManagerId: string): Promise<ServiceRequest | undefined>;
  getAllServiceRequests(): Promise<ServiceRequest[]>;
  deleteServiceRequest(id: string): Promise<boolean>;
  
  // Work orders
  getWorkOrder(id: string): Promise<WorkOrder | undefined>;
  getWorkOrdersByServiceRequest(serviceRequestId: string): Promise<WorkOrder[]>;
  getWorkOrdersByManager(homeManagerId: string): Promise<WorkOrder[]>;
  getWorkOrdersByContractor(contractorId: string): Promise<WorkOrder[]>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  completeWorkOrder(id: string, completionNotes: string): Promise<WorkOrder | undefined>;
  getAllWorkOrders(): Promise<WorkOrder[]>;
  deleteWorkOrder(id: string): Promise<boolean>;
  
  // Estimates
  getEstimate(id: string): Promise<Estimate | undefined>;
  getEstimatesByServiceRequest(serviceRequestId: string): Promise<Estimate[]>;
  getEstimatesByContractor(contractorId: string): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  approveEstimate(id: string): Promise<Estimate | undefined>;
  rejectEstimate(id: string): Promise<Estimate | undefined>;
  getAllEstimates(): Promise<Estimate[]>;
  deleteEstimate(id: string): Promise<boolean>;
  
  // Invoices
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByMember(memberId: string): Promise<Invoice[]>;
  getInvoicesByWorkOrder(workOrderId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  payInvoice(id: string, paymentMethod: string, transactionId: string): Promise<Invoice | undefined>;
  getAllInvoices(): Promise<Invoice[]>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Loyalty points
  getLoyaltyPointBalance(memberId: string): Promise<number>;
  getLoyaltyPointTransactions(memberId: string): Promise<LoyaltyPointTransaction[]>;
  addLoyaltyPoints(memberId: string, points: number, description: string, referenceId?: string, referenceType?: string): Promise<LoyaltyPointTransaction>;
  spendLoyaltyPoints(memberId: string, points: number, description: string, referenceId?: string, referenceType?: string): Promise<LoyaltyPointTransaction>;
  
  // Deals
  getDeal(id: string): Promise<Deal | undefined>;
  getDealsByMerchant(merchantId: string): Promise<Deal[]>;
  getActiveDeals(filters?: { category?: string; membershipRequired?: string; isExclusive?: boolean }): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal | undefined>;
  redeemDeal(dealId: string, memberId: string): Promise<DealRedemption>;
  getAllDeals(): Promise<Deal[]>;
  deleteDeal(id: string): Promise<boolean>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  getConversation(senderId: string, receiverId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  getAllMessages(): Promise<Message[]>;
  deleteMessage(id: string): Promise<boolean>;
  
  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Notification Settings
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // Calendar events
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEventsByUser(userId: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  
  // Community
  getCommunityPosts(limit?: number, offset?: number): Promise<CommunityPost[]>;
  getCommunityPost(id: string): Promise<CommunityPost | undefined>;
  createCommunityPost(authorId: string, content: string, images?: string[], tags?: string[]): Promise<CommunityPost>;
  
  getCommunityGroups(): Promise<CommunityGroup[]>;
  getCommunityGroup(id: string): Promise<CommunityGroup | undefined>;
  createCommunityGroup(name: string, description: string, category: string, createdBy: string): Promise<CommunityGroup>;
  
  // Forums
  getForum(id: string): Promise<Forum | undefined>;
  getForums(filters?: { isActive?: boolean; forumType?: string; communityGroupId?: string; isPrivate?: boolean }): Promise<Forum[]>;
  getForumsByGroup(communityGroupId: string): Promise<Forum[]>;
  getPublicForums(): Promise<Forum[]>; // Forums available to all users
  createForum(forum: InsertForum): Promise<Forum>;
  updateForum(id: string, updates: Partial<InsertForum>): Promise<Forum | undefined>;
  deleteForum(id: string): Promise<boolean>;
  
  // Forum Topics
  getForumTopic(id: string): Promise<ForumTopic | undefined>;
  getForumTopicBySlug(forumId: string, slug: string): Promise<ForumTopic | undefined>;
  getForumTopics(
    forumId: string, 
    filters?: { 
      status?: string; 
      isPinned?: boolean; 
      isLocked?: boolean; 
      isSolved?: boolean;
      authorId?: string;
      tags?: string[];
    }
  ): Promise<ForumTopic[]>;
  getTopicsByAuthor(authorId: string): Promise<ForumTopic[]>;
  getRecentTopics(limit?: number): Promise<ForumTopic[]>; // Cross-forum recent topics
  getTrendingTopics(limit?: number): Promise<ForumTopic[]>; // Based on activity
  createForumTopic(topic: InsertForumTopic): Promise<ForumTopic>;
  updateForumTopic(id: string, updates: Partial<InsertForumTopic>): Promise<ForumTopic | undefined>;
  pinTopic(id: string, isPinned: boolean): Promise<ForumTopic | undefined>;
  lockTopic(id: string, isLocked: boolean): Promise<ForumTopic | undefined>;
  solveTopic(id: string, isSolved: boolean, acceptedAnswerId?: string): Promise<ForumTopic | undefined>;
  incrementTopicViews(id: string): Promise<ForumTopic | undefined>;
  deleteForumTopic(id: string): Promise<boolean>;
  
  // Forum Posts
  getForumPost(id: string): Promise<ForumPost | undefined>;
  getForumPosts(
    topicId: string,
    filters?: {
      status?: string;
      parentPostId?: string | null; // null = top-level posts, string = replies to that post
      postType?: string;
      authorId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ForumPost[]>;
  getPostsByAuthor(authorId: string, limit?: number): Promise<ForumPost[]>;
  getTopLevelPosts(topicId: string): Promise<ForumPost[]>; // Posts with no parent (level 0)
  getPostReplies(parentPostId: string): Promise<ForumPost[]>; // Direct replies to a post
  getPostThread(postId: string): Promise<ForumPost[]>; // Get full thread starting from a post
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: string, updates: Partial<InsertForumPost>): Promise<ForumPost | undefined>;
  markPostAsAnswer(postId: string, topicId: string, acceptedBy: string): Promise<ForumPost | undefined>;
  unmarkPostAsAnswer(postId: string, topicId: string): Promise<ForumPost | undefined>;
  deleteForumPost(id: string): Promise<boolean>;
  
  // Forum Post Voting
  getPostVote(postId: string, userId: string): Promise<ForumPostVote | undefined>;
  getPostVotes(postId: string): Promise<ForumPostVote[]>;
  createPostVote(vote: InsertForumPostVote): Promise<ForumPostVote>;
  updatePostVote(postId: string, userId: string, voteType: 'up' | 'down'): Promise<ForumPostVote | undefined>;
  removePostVote(postId: string, userId: string): Promise<boolean>;
  getPostScore(postId: string): Promise<{ upvotes: number; downvotes: number; score: number }>;
  
  // Forum Statistics and Analytics
  getForumStats(forumId: string): Promise<{ topicCount: number; postCount: number; participantCount: number }>;
  getTopicStats(topicId: string): Promise<{ postCount: number; participantCount: number; viewCount: number }>;
  getUserForumActivity(userId: string): Promise<{ topicCount: number; postCount: number; votesReceived: number }>;
  
  // Forum Moderation
  moderatePost(postId: string, status: string, moderatorId: string): Promise<ForumPost | undefined>;
  flagPost(postId: string, userId: string, reason: string): Promise<void>;
  getFlaggedPosts(forumId?: string): Promise<ForumPost[]>;
  
  // Gamification - Badges
  getBadge(id: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge | undefined>;
  deleteBadge(id: string): Promise<boolean>;
  
  // Gamification - Ranks
  getRank(id: string): Promise<Rank | undefined>;
  getAllRanks(): Promise<Rank[]>;
  createRank(rank: InsertRank): Promise<Rank>;
  updateRank(id: string, updates: Partial<InsertRank>): Promise<Rank | undefined>;
  deleteRank(id: string): Promise<boolean>;
  
  // Gamification - Achievements
  getAchievement(id: string): Promise<Achievement | undefined>;
  getAllAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, updates: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: string): Promise<boolean>;
  
  // Maintenance Items
  getMaintenanceItem(id: string): Promise<MaintenanceItem | undefined>;
  getAllMaintenanceItems(): Promise<MaintenanceItem[]>;
  createMaintenanceItem(item: InsertMaintenanceItem): Promise<MaintenanceItem>;
  updateMaintenanceItem(id: string, updates: Partial<InsertMaintenanceItem>): Promise<MaintenanceItem | undefined>;
  deleteMaintenanceItem(id: string): Promise<boolean>;
  
  // ===========================
  // SCHEDULING SYSTEM METHODS
  // ===========================
  
  // Time slot management
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  getContractorTimeSlots(contractorId: string, startDate?: Date, endDate?: Date): Promise<TimeSlot[]>;
  getOverlappingTimeSlots(contractorId: string, startTime: Date, endTime: Date): Promise<TimeSlot[]>;
  createTimeSlot(slot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: string): Promise<boolean>;
  
  // Work order scheduling queries
  getOverlappingWorkOrders(contractorId: string, startTime: Date, endTime: Date): Promise<WorkOrder[]>;
  getWorkOrdersByDateRange(contractorId: string, startDate: Date, endDate: Date): Promise<WorkOrder[]>;
  
  // Schedule conflict management
  getScheduleConflict(id: string): Promise<ScheduleConflict | undefined>;
  getScheduleConflictsByWorkOrder(workOrderId: string): Promise<ScheduleConflict[]>;
  getScheduleConflictsByContractor(contractorId: string, includeResolved?: boolean): Promise<ScheduleConflict[]>;
  createScheduleConflict(conflict: InsertScheduleConflict): Promise<ScheduleConflict>;
  updateScheduleConflict(id: string, updates: Partial<InsertScheduleConflict>): Promise<ScheduleConflict | undefined>;
  resolveScheduleConflict(id: string, resolvedBy: string, resolutionNotes: string): Promise<ScheduleConflict | undefined>;
  
  // Schedule audit logging
  getScheduleAuditLog(id: string): Promise<ScheduleAuditLog | undefined>;
  getScheduleAuditLogsByEntity(entityType: string, entityId: string): Promise<ScheduleAuditLog[]>;
  getScheduleAuditLogsByUser(userId: string, limit?: number): Promise<ScheduleAuditLog[]>;
  createScheduleAuditLog(auditEntry: InsertScheduleAuditLog): Promise<ScheduleAuditLog>;
  
  // Data seeding and initialization
  seedComprehensiveData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private memberProfiles: Map<string, MemberProfile>;
  private contractorProfiles: Map<string, ContractorProfile>;
  private merchantProfiles: Map<string, MerchantProfile>;
  private homeDetails: Map<string, HomeDetails>;
  private serviceRequests: Map<string, ServiceRequest>;
  private workOrders: Map<string, WorkOrder>;
  private estimates: Map<string, Estimate>;
  private invoices: Map<string, Invoice>;
  private loyaltyPointTransactions: Map<string, LoyaltyPointTransaction>;
  private deals: Map<string, Deal>;
  private dealRedemptions: Map<string, DealRedemption>;
  private messages: Map<string, Message>;
  private notifications: Map<string, Notification>;
  private notificationSettings: Map<string, NotificationSettings>;
  private calendarEvents: Map<string, CalendarEvent>;
  private communityPosts: Map<string, CommunityPost>;
  private communityGroups: Map<string, CommunityGroup>;
  private badges: Map<string, Badge>;
  private ranks: Map<string, Rank>;
  private achievements: Map<string, Achievement>;
  private maintenanceItems: Map<string, MaintenanceItem>;

  constructor() {
    this.users = new Map();
    this.memberProfiles = new Map();
    this.contractorProfiles = new Map();
    this.merchantProfiles = new Map();
    this.homeDetails = new Map();
    this.serviceRequests = new Map();
    this.workOrders = new Map();
    this.estimates = new Map();
    this.invoices = new Map();
    this.loyaltyPointTransactions = new Map();
    this.deals = new Map();
    this.dealRedemptions = new Map();
    this.messages = new Map();
    this.notifications = new Map();
    this.notificationSettings = new Map();
    this.calendarEvents = new Map();
    this.communityPosts = new Map();
    this.communityGroups = new Map();
    this.badges = new Map();
    this.ranks = new Map();
    this.achievements = new Map();
    this.maintenanceItems = new Map();
  }

  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      // Legacy fields (null - no longer accepted via API)
      username: null,
      password: null,
      // New Replit Auth fields
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      // Business fields
      role: insertUser.role || "homeowner",
      isActive: insertUser.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Required for Replit Auth - creates or updates user based on auth claims
  async upsertUser(userData: UpsertUser): Promise<User> {
    console.log(`[STORAGE] upsertUser called with ID: "${userData.id}" (type: ${typeof userData.id})`);
    const now = new Date();
    
    // Ensure we have a valid user ID
    if (!userData.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    // Check if user already exists
    const existingUser = this.users.get(userData.id);
    console.log(`[STORAGE] Existing user check for "${userData.id}": ${existingUser ? 'found' : 'not found'}`);
    
    if (existingUser) {
      // Update existing user with new auth data, preserving existing role
      const updatedUser: User = {
        ...existingUser,
        email: userData.email || existingUser.email,
        firstName: userData.firstName || existingUser.firstName,
        lastName: userData.lastName || existingUser.lastName,
        profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
        // Preserve role if set, or apply from userData if provided
        role: (userData as any).role || existingUser.role,
        updatedAt: now
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user from auth claims
      const newUser: User = {
        id: userData.id,
        // Legacy fields (null for new Replit Auth users)
        username: null,
        password: null,
        // New Replit Auth fields
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        // Business fields (defaults for new users, or from userData if admin bootstrap)
        role: (userData as any).role || "homeowner", // Default role for new users
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      this.users.set(userData.id, newUser);
      console.log(`[STORAGE] New user created and stored. Map size now: ${this.users.size}`);
      console.log(`[STORAGE] Verifying storage: user ${userData.id} exists = ${this.users.has(userData.id)}`);
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = applyDefined(user, updates);
    updatedUser.updatedAt = new Date();
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Member profile methods
  async getMemberProfile(id: string): Promise<MemberProfile | undefined> {
    return this.memberProfiles.get(id);
  }

  async getMemberProfileByUserId(userId: string): Promise<MemberProfile | undefined> {
    return Array.from(this.memberProfiles.values()).find(profile => profile.userId === userId);
  }

  async createMemberProfile(insertProfile: InsertMemberProfile): Promise<MemberProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: MemberProfile = { 
      id,
      userId: insertProfile.userId,
      nickname: insertProfile.nickname,
      firstName: insertProfile.firstName || null,
      lastName: insertProfile.lastName || null,
      email: insertProfile.email || null,
      phone: insertProfile.phone || null,
      avatarUrl: insertProfile.avatarUrl || null,
      coverImageUrl: insertProfile.coverImageUrl || null,
      membershipTier: insertProfile.membershipTier || "HomeHUB",
      loyaltyPoints: insertProfile.loyaltyPoints || 0,
      bio: insertProfile.bio || null,
      location: insertProfile.location || null,
      address: insertProfile.address || null,
      city: insertProfile.city || null,
      state: insertProfile.state || null,
      zipCode: insertProfile.zipCode || null,
      homeManagerId: insertProfile.homeManagerId || null,
      joinedAt: now,
      updatedAt: now
    };
    this.memberProfiles.set(id, profile);
    return profile;
  }

  async updateMemberProfile(id: string, updates: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined> {
    const profile = this.memberProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = applyDefined(profile, updates);
    updatedProfile.updatedAt = new Date();
    this.memberProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async getMembersByTier(tier: string): Promise<MemberProfile[]> {
    return Array.from(this.memberProfiles.values()).filter(profile => profile.membershipTier === tier);
  }

  async getAllMemberProfiles(): Promise<MemberProfile[]> {
    return Array.from(this.memberProfiles.values());
  }

  // Sanitized public access methods (PII-safe)
  async getPublicContractors(filters?: { isVerified?: boolean; isActive?: boolean; specialties?: string[]; location?: string }): Promise<any[]> {
    const contractors = await this.getContractors(filters);
    return contractors.map(contractor => ({
      id: contractor.id,
      businessName: contractor.businessName,
      serviceRadius: contractor.serviceRadius,
      hourlyRate: contractor.hourlyRate,
      isVerified: contractor.isVerified,
      verifiedAt: contractor.verifiedAt,
      bio: contractor.bio,
      specialties: contractor.specialties,
      certifications: contractor.certifications,
      yearsExperience: contractor.yearsExperience,
      portfolioImages: contractor.portfolioImages,
      rating: contractor.rating,
      reviewCount: contractor.reviewCount,
      isActive: contractor.isActive,
      availability: contractor.availability,
      city: contractor.city,
      state: contractor.state
    }));
  }

  async getPublicMerchants(filters?: { isVerified?: boolean; isActive?: boolean; businessType?: string; location?: string }): Promise<any[]> {
    const merchants = await this.getMerchants(filters);
    return merchants.map(merchant => ({
      id: merchant.id,
      businessName: merchant.businessName,
      website: merchant.website,
      businessType: merchant.businessType,
      businessDescription: merchant.businessDescription,
      operatingHours: merchant.operatingHours,
      serviceArea: merchant.serviceArea,
      specialties: merchant.specialties,
      acceptedPaymentMethods: merchant.acceptedPaymentMethods,
      businessImages: merchant.businessImages,
      logoUrl: merchant.logoUrl,
      rating: merchant.rating,
      reviewCount: merchant.reviewCount,
      isVerified: merchant.isVerified,
      verifiedAt: merchant.verifiedAt,
      isActive: merchant.isActive,
      city: merchant.city,
      state: merchant.state
    }));
  }

  async getPublicMembersByTier(tier: string): Promise<any[]> {
    const members = await this.getMembersByTier(tier);
    return members.map(profile => ({
      id: profile.id,
      nickname: profile.nickname,
      membershipTier: profile.membershipTier,
      loyaltyPoints: profile.loyaltyPoints,
      bio: profile.bio,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      coverImageUrl: profile.coverImageUrl,
      joinedAt: profile.joinedAt
    }));
  }

  // Contractor profile methods
  async getContractorProfile(id: string): Promise<ContractorProfile | undefined> {
    return this.contractorProfiles.get(id);
  }

  async getContractorProfileByUserId(userId: string): Promise<ContractorProfile | undefined> {
    return Array.from(this.contractorProfiles.values()).find(profile => profile.userId === userId);
  }

  async createContractorProfile(insertProfile: InsertContractorProfile): Promise<ContractorProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: ContractorProfile = { 
      id,
      userId: insertProfile.userId,
      businessName: insertProfile.businessName,
      firstName: insertProfile.firstName,
      lastName: insertProfile.lastName,
      phone: insertProfile.phone,
      email: insertProfile.email,
      address: insertProfile.address,
      city: insertProfile.city,
      state: insertProfile.state,
      zipCode: insertProfile.zipCode,
      serviceRadius: insertProfile.serviceRadius || 25,
      hourlyRate: insertProfile.hourlyRate || null,
      licenseNumber: insertProfile.licenseNumber,
      licenseType: insertProfile.licenseType,
      licenseExpiryDate: insertProfile.licenseExpiryDate,
      insuranceProvider: insertProfile.insuranceProvider,
      insurancePolicyNumber: insertProfile.insurancePolicyNumber,
      insuranceExpiryDate: insertProfile.insuranceExpiryDate,
      bondingProvider: insertProfile.bondingProvider || null,
      bondingAmount: insertProfile.bondingAmount || null,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
      bio: insertProfile.bio || null,
      specialties: (insertProfile.specialties as string[]) || null,
      certifications: (insertProfile.certifications as string[]) || null,
      yearsExperience: insertProfile.yearsExperience || null,
      portfolioImages: (insertProfile.portfolioImages as string[]) || null,
      rating: "0.00",
      reviewCount: 0,
      isActive: true,
      availability: insertProfile.availability || null,
      createdAt: now,
      updatedAt: now
    };
    this.contractorProfiles.set(id, profile);
    return profile;
  }

  async updateContractorProfile(id: string, updates: Partial<InsertContractorProfile>): Promise<ContractorProfile | undefined> {
    const profile = this.contractorProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = applyDefined(profile, updates);
    updatedProfile.updatedAt = new Date();
    this.contractorProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async getContractors(filters?: { isVerified?: boolean; isActive?: boolean; specialties?: string[]; location?: string }): Promise<ContractorProfile[]> {
    let contractors = Array.from(this.contractorProfiles.values());
    
    if (filters?.isVerified !== undefined) {
      contractors = contractors.filter(c => c.isVerified === filters.isVerified);
    }
    if (filters?.isActive !== undefined) {
      contractors = contractors.filter(c => c.isActive === filters.isActive);
    }
    
    return contractors;
  }

  async verifyContractor(id: string, verifiedBy: string): Promise<ContractorProfile | undefined> {
    const profile = this.contractorProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile: ContractorProfile = { 
      ...profile, 
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
      updatedAt: new Date() 
    };
    this.contractorProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async getAllContractorProfiles(): Promise<ContractorProfile[]> {
    return Array.from(this.contractorProfiles.values());
  }

  // Merchant profile methods
  async getMerchantProfile(id: string): Promise<MerchantProfile | undefined> {
    return this.merchantProfiles.get(id);
  }

  async getMerchantProfileByUserId(userId: string): Promise<MerchantProfile | undefined> {
    return Array.from(this.merchantProfiles.values()).find(profile => profile.userId === userId);
  }

  async createMerchantProfile(insertProfile: InsertMerchantProfile): Promise<MerchantProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: MerchantProfile = { 
      id,
      userId: insertProfile.userId,
      businessName: insertProfile.businessName,
      ownerName: insertProfile.ownerName,
      phone: insertProfile.phone,
      email: insertProfile.email,
      website: insertProfile.website || null,
      address: insertProfile.address,
      city: insertProfile.city,
      state: insertProfile.state,
      zipCode: insertProfile.zipCode,
      businessType: insertProfile.businessType,
      businessDescription: insertProfile.businessDescription,
      businessLicense: insertProfile.businessLicense,
      taxId: insertProfile.taxId,
      operatingHours: insertProfile.operatingHours || null,
      serviceArea: insertProfile.serviceArea || null,
      specialties: (insertProfile.specialties as string[]) || null,
      acceptedPaymentMethods: (insertProfile.acceptedPaymentMethods as string[]) || null,
      businessImages: (insertProfile.businessImages as string[]) || null,
      logoUrl: insertProfile.logoUrl || null,
      rating: "0.00",
      reviewCount: 0,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    this.merchantProfiles.set(id, profile);
    return profile;
  }

  async updateMerchantProfile(id: string, updates: Partial<InsertMerchantProfile>): Promise<MerchantProfile | undefined> {
    const profile = this.merchantProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = applyDefined(profile, updates);
    updatedProfile.updatedAt = new Date();
    this.merchantProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async getMerchants(filters?: { isVerified?: boolean; isActive?: boolean; businessType?: string; location?: string }): Promise<MerchantProfile[]> {
    let merchants = Array.from(this.merchantProfiles.values());
    
    if (filters?.isVerified !== undefined) {
      merchants = merchants.filter(m => m.isVerified === filters.isVerified);
    }
    if (filters?.isActive !== undefined) {
      merchants = merchants.filter(m => m.isActive === filters.isActive);
    }
    if (filters?.businessType) {
      merchants = merchants.filter(m => m.businessType === filters.businessType);
    }
    
    return merchants;
  }

  async getAllMerchantProfiles(): Promise<MerchantProfile[]> {
    return Array.from(this.merchantProfiles.values());
  }

  // Home details methods
  async getHomeDetails(id: string): Promise<HomeDetails | undefined> {
    return this.homeDetails.get(id);
  }

  async getHomeDetailsByProfileId(profileId: string): Promise<HomeDetails | undefined> {
    return Array.from(this.homeDetails.values()).find(details => details.profileId === profileId);
  }

  async createHomeDetails(insertDetails: InsertHomeDetails): Promise<HomeDetails> {
    const id = randomUUID();
    const now = new Date();
    const details: HomeDetails = {
      id,
      profileId: insertDetails.profileId,
      propertyType: insertDetails.propertyType || null,
      yearBuilt: insertDetails.yearBuilt || null,
      squareFootage: insertDetails.squareFootage || null,
      bedrooms: insertDetails.bedrooms || null,
      bathrooms: insertDetails.bathrooms || null,
      lotSize: insertDetails.lotSize || null,
      heatingType: insertDetails.heatingType || null,
      coolingType: insertDetails.coolingType || null,
      roofType: insertDetails.roofType || null,
      foundation: insertDetails.foundation || null,
      flooring: insertDetails.flooring || null,
      appliances: insertDetails.appliances || null,
      specialFeatures: insertDetails.specialFeatures || null,
      maintenanceNotes: insertDetails.maintenanceNotes || null,
      emergencyContacts: insertDetails.emergencyContacts || null,
      createdAt: now,
      updatedAt: now
    };
    this.homeDetails.set(id, details);
    return details;
  }

  async updateHomeDetails(id: string, updates: Partial<InsertHomeDetails>): Promise<HomeDetails | undefined> {
    const details = this.homeDetails.get(id);
    if (!details) return undefined;
    
    const updatedDetails = applyDefined(details, updates);
    updatedDetails.updatedAt = new Date();
    this.homeDetails.set(id, updatedDetails);
    return updatedDetails;
  }

  // Service request methods
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.get(id);
  }

  async getServiceRequestsByMember(memberId: string): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(req => req.memberId === memberId);
  }

  async getServiceRequestsByManager(homeManagerId: string): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(req => req.homeManagerId === homeManagerId);
  }

  async createServiceRequest(insertRequest: InsertServiceRequest): Promise<ServiceRequest> {
    const id = randomUUID();
    const now = new Date();
    const request: ServiceRequest = { 
      id,
      memberId: insertRequest.memberId,
      
      // Service Type and Category
      serviceType: insertRequest.serviceType,
      category: insertRequest.category,
      
      // Basic Request Info
      title: insertRequest.title,
      description: insertRequest.description,
      urgency: insertRequest.urgency || "normal",
      
      // Location and Timing
      address: insertRequest.address,
      city: insertRequest.city,
      state: insertRequest.state,
      zipCode: insertRequest.zipCode,
      preferredDateTime: insertRequest.preferredDateTime || null,
      
      // Scheduling and Seasonal Controls (for PreventiT!)
      isSeasonalService: insertRequest.isSeasonalService ?? false,
      seasonalWindow: insertRequest.seasonalWindow || null,
      slotDuration: insertRequest.slotDuration || 60,
      requiredSkills: (insertRequest.requiredSkills as string[]) || null,
      
      // Workflow and Assignment
      status: "pending",
      homeManagerId: insertRequest.homeManagerId || null,
      assignedContractorId: null,
      assignedAt: null,
      
      // Time Tracking
      estimatedCompletionDate: insertRequest.estimatedCompletionDate || null,
      actualCompletionDate: null,
      estimatedDuration: insertRequest.estimatedDuration || null,
      actualDuration: null,
      
      // Payment and Pricing (enhanced for HandleiT! escrow)
      estimatedCost: insertRequest.estimatedCost || null,
      finalCost: null,
      requiresEscrow: insertRequest.requiresEscrow ?? false,
      escrowAmount: insertRequest.escrowAmount || null,
      escrowStatus: null,
      
      // Loyalty and Rewards (for LoyalizeiT!)
      pointsReward: insertRequest.pointsReward || 0,
      membershipBenefitApplied: false,
      loyaltyDiscountApplied: "0.00",
      
      // Documentation
      images: (insertRequest.images as string[]) || null,
      memberNotes: insertRequest.memberNotes || null,
      internalNotes: insertRequest.internalNotes || null,
      completionNotes: null,
      
      // Metadata
      serviceMetadata: insertRequest.serviceMetadata || null,
      createdAt: now,
      updatedAt: now
    };
    this.serviceRequests.set(id, request);
    return request;
  }

  async updateServiceRequest(id: string, updates: Partial<InsertServiceRequest>): Promise<ServiceRequest | undefined> {
    const request = this.serviceRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = applyDefined(request, updates);
    updatedRequest.updatedAt = new Date();
    this.serviceRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async assignServiceRequest(id: string, homeManagerId: string): Promise<ServiceRequest | undefined> {
    const request = this.serviceRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: ServiceRequest = {
      ...request,
      homeManagerId,
      assignedAt: new Date(),
      status: "assigned",
      updatedAt: new Date()
    };
    this.serviceRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values());
  }

  // Work order methods
  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async getWorkOrdersByServiceRequest(serviceRequestId: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(wo => wo.serviceRequestId === serviceRequestId);
  }

  async getWorkOrdersByManager(homeManagerId: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(wo => wo.homeManagerId === homeManagerId);
  }

  async getWorkOrdersByContractor(contractorId: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(wo => wo.contractorId === contractorId);
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = randomUUID();
    const now = new Date();
    const workOrderNumber = `WO-${Date.now()}`;
    const workOrder: WorkOrder = { 
      id,
      serviceRequestId: insertWorkOrder.serviceRequestId,
      homeManagerId: insertWorkOrder.homeManagerId,
      contractorId: insertWorkOrder.contractorId || null,
      workOrderNumber,
      status: "created",
      scheduledStartDate: insertWorkOrder.scheduledStartDate || null,
      scheduledEndDate: insertWorkOrder.scheduledEndDate || null,
      actualStartDate: null,
      actualEndDate: null,
      workDescription: insertWorkOrder.workDescription,
      materialsNeeded: insertWorkOrder.materialsNeeded || null,
      laborHours: insertWorkOrder.laborHours || null,
      workNotes: insertWorkOrder.workNotes || null,
      completionNotes: insertWorkOrder.completionNotes || null,
      beforeImages: (insertWorkOrder.beforeImages as string[]) || null,
      afterImages: (insertWorkOrder.afterImages as string[]) || null,
      memberSignature: insertWorkOrder.memberSignature || null,
      contractorSignature: insertWorkOrder.contractorSignature || null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) return undefined;
    
    const updatedWorkOrder = applyDefined(workOrder, updates);
    updatedWorkOrder.updatedAt = new Date();
    this.workOrders.set(id, updatedWorkOrder);
    return updatedWorkOrder;
  }

  async completeWorkOrder(id: string, completionNotes: string): Promise<WorkOrder | undefined> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) return undefined;
    
    const completedWorkOrder: WorkOrder = {
      ...workOrder,
      status: "completed",
      completionNotes,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    this.workOrders.set(id, completedWorkOrder);
    return completedWorkOrder;
  }

  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  // Estimate methods
  async getEstimate(id: string): Promise<Estimate | undefined> {
    return this.estimates.get(id);
  }

  async getEstimatesByServiceRequest(serviceRequestId: string): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(est => est.serviceRequestId === serviceRequestId);
  }

  async getEstimatesByContractor(contractorId: string): Promise<Estimate[]> {
    return Array.from(this.estimates.values()).filter(est => est.contractorId === contractorId);
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const id = randomUUID();
    const now = new Date();
    const estimateNumber = `EST-${Date.now()}`;
    const estimate: Estimate = { 
      id,
      serviceRequestId: insertEstimate.serviceRequestId,
      contractorId: insertEstimate.contractorId,
      estimateNumber,
      title: insertEstimate.title,
      description: insertEstimate.description,
      laborCost: insertEstimate.laborCost,
      materialCost: insertEstimate.materialCost,
      additionalCosts: insertEstimate.additionalCosts || "0.00",
      totalCost: insertEstimate.totalCost,
      estimatedHours: insertEstimate.estimatedHours || null,
      startDate: insertEstimate.startDate || null,
      completionDate: insertEstimate.completionDate || null,
      materials: insertEstimate.materials || null,
      laborBreakdown: insertEstimate.laborBreakdown || null,
      terms: insertEstimate.terms || null,
      validUntil: insertEstimate.validUntil,
      status: "pending",
      submittedAt: now,
      respondedAt: null,
      notes: insertEstimate.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.estimates.set(id, estimate);
    return estimate;
  }

  async updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const estimate = this.estimates.get(id);
    if (!estimate) return undefined;
    
    const updatedEstimate = applyDefined(estimate, updates);
    updatedEstimate.updatedAt = new Date();
    this.estimates.set(id, updatedEstimate);
    return updatedEstimate;
  }

  async approveEstimate(id: string): Promise<Estimate | undefined> {
    const estimate = this.estimates.get(id);
    if (!estimate) return undefined;
    
    const approvedEstimate: Estimate = {
      ...estimate,
      status: "approved",
      respondedAt: new Date(),
      updatedAt: new Date()
    };
    this.estimates.set(id, approvedEstimate);
    return approvedEstimate;
  }

  async rejectEstimate(id: string): Promise<Estimate | undefined> {
    const estimate = this.estimates.get(id);
    if (!estimate) return undefined;
    
    const rejectedEstimate: Estimate = {
      ...estimate,
      status: "rejected",
      respondedAt: new Date(),
      updatedAt: new Date()
    };
    this.estimates.set(id, rejectedEstimate);
    return rejectedEstimate;
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return Array.from(this.estimates.values());
  }

  // Invoice methods
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByMember(memberId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(inv => inv.memberId === memberId);
  }

  async getInvoicesByWorkOrder(workOrderId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(inv => inv.workOrderId === workOrderId);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const now = new Date();
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice: Invoice = { 
      id,
      workOrderId: insertInvoice.workOrderId,
      memberId: insertInvoice.memberId,
      invoiceNumber,
      subtotal: insertInvoice.subtotal,
      tax: insertInvoice.tax || "0.00",
      total: insertInvoice.total,
      loyaltyPointsUsed: insertInvoice.loyaltyPointsUsed || 0,
      loyaltyPointsValue: insertInvoice.loyaltyPointsValue || "0.00",
      amountDue: insertInvoice.amountDue,
      loyaltyPointsEarned: insertInvoice.loyaltyPointsEarned || 0,
      status: "draft",
      dueDate: insertInvoice.dueDate,
      paidAt: null,
      paymentMethod: null,
      paymentTransactionId: null,
      lineItems: insertInvoice.lineItems,
      notes: insertInvoice.notes || null,
      sentAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = applyDefined(invoice, updates);
    updatedInvoice.updatedAt = new Date();
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async payInvoice(id: string, paymentMethod: string, transactionId: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const paidInvoice: Invoice = {
      ...invoice,
      status: "paid",
      paidAt: new Date(),
      paymentMethod,
      paymentTransactionId: transactionId,
      updatedAt: new Date()
    };
    this.invoices.set(id, paidInvoice);
    return paidInvoice;
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  // Loyalty point methods
  async getLoyaltyPointBalance(memberId: string): Promise<number> {
    const transactions = Array.from(this.loyaltyPointTransactions.values())
      .filter(t => t.memberId === memberId);
    return transactions.reduce((sum, t) => sum + t.points, 0);
  }

  async getLoyaltyPointTransactions(memberId: string): Promise<LoyaltyPointTransaction[]> {
    return Array.from(this.loyaltyPointTransactions.values())
      .filter(t => t.memberId === memberId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addLoyaltyPoints(memberId: string, points: number, description: string, referenceId?: string, referenceType?: string): Promise<LoyaltyPointTransaction> {
    const id = randomUUID();
    const transaction: LoyaltyPointTransaction = {
      id,
      memberId,
      transactionType: "earned",
      points,
      description,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      expiresAt: null, // Could implement expiry logic
      createdAt: new Date()
    };
    this.loyaltyPointTransactions.set(id, transaction);
    return transaction;
  }

  async spendLoyaltyPoints(memberId: string, points: number, description: string, referenceId?: string, referenceType?: string): Promise<LoyaltyPointTransaction> {
    const id = randomUUID();
    const transaction: LoyaltyPointTransaction = {
      id,
      memberId,
      transactionType: "spent",
      points: -points,
      description,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      expiresAt: null,
      createdAt: new Date()
    };
    this.loyaltyPointTransactions.set(id, transaction);
    return transaction;
  }

  // Deal methods
  async getDeal(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async getDealsByMerchant(merchantId: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.merchantId === merchantId);
  }

  async getActiveDeals(filters?: { category?: string; membershipRequired?: string; isExclusive?: boolean }): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.isActive);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const now = new Date();
    const deal: Deal = { 
      id,
      merchantId: insertDeal.merchantId,
      title: insertDeal.title,
      description: insertDeal.description,
      category: insertDeal.category,
      discountType: insertDeal.discountType,
      discountValue: insertDeal.discountValue,
      originalPrice: insertDeal.originalPrice || null,
      finalPrice: insertDeal.finalPrice || null,
      validFrom: insertDeal.validFrom,
      validUntil: insertDeal.validUntil,
      isExclusive: insertDeal.isExclusive || false,
      membershipRequired: insertDeal.membershipRequired || null,
      maxUses: insertDeal.maxUses || null,
      currentUses: 0,
      tags: (insertDeal.tags as string[]) || null,
      termsAndConditions: insertDeal.termsAndConditions,
      images: (insertDeal.images as string[]) || null,
      isActive: insertDeal.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal = applyDefined(deal, updates);
    updatedDeal.updatedAt = new Date();
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async redeemDeal(dealId: string, memberId: string): Promise<DealRedemption> {
    const id = randomUUID();
    const redemption: DealRedemption = {
      id,
      dealId,
      memberId,
      redemptionCode: `RDM-${Date.now()}`,
      usedAt: null,
      isUsed: false,
      createdAt: new Date()
    };
    this.dealRedemptions.set(id, redemption);
    return redemption;
  }

  async getAllDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  // Message methods
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.receiverId === userId);
  }

  async getConversation(senderId: string, receiverId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === senderId && msg.receiverId === receiverId) ||
        (msg.senderId === receiverId && msg.receiverId === senderId)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      id,
      senderId: insertMessage.senderId,
      receiverId: insertMessage.receiverId,
      subject: insertMessage.subject || null,
      content: insertMessage.content,
      isRead: insertMessage.isRead || false,
      threadId: insertMessage.threadId || null,
      attachments: insertMessage.attachments || null,
      messageType: insertMessage.messageType || "general",
      relatedEntityId: insertMessage.relatedEntityId || null,
      relatedEntityType: insertMessage.relatedEntityType || null,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const readMessage: Message = { ...message, isRead: true };
    this.messages.set(id, readMessage);
    return readMessage;
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  // Notification methods
  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = { 
      id,
      userId: insertNotification.userId,
      title: insertNotification.title,
      message: insertNotification.message,
      type: insertNotification.type,
      isRead: insertNotification.isRead || false,
      actionUrl: insertNotification.actionUrl || null,
      metadata: insertNotification.metadata || null,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const readNotification: Notification = { ...notification, isRead: true };
    this.notifications.set(id, readNotification);
    return readNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId && !notif.isRead)
      .forEach(notif => {
        const readNotification: Notification = { ...notif, isRead: true };
        this.notifications.set(notif.id, readNotification);
      });
  }

  // Notification Settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    return Array.from(this.notificationSettings.values()).find(settings => settings.userId === userId);
  }

  async createNotificationSettings(insertSettings: InsertNotificationSettings): Promise<NotificationSettings> {
    const id = randomUUID();
    const now = new Date();
    const settings: NotificationSettings = {
      id,
      userId: insertSettings.userId,
      // Mentions
      mentions: insertSettings.mentions ?? true,
      // Posts & Comments
      postReplies: insertSettings.postReplies ?? true,
      // Account Settings
      passwordChanged: insertSettings.passwordChanged ?? true,
      // Activity Feeds
      activityFeedReplies: insertSettings.activityFeedReplies ?? true,
      // Social Groups
      groupDetailsUpdated: insertSettings.groupDetailsUpdated ?? true,
      groupPromotion: insertSettings.groupPromotion ?? true,
      groupInviteReceived: insertSettings.groupInviteReceived ?? true,
      groupJoinRequest: insertSettings.groupJoinRequest ?? true,
      groupJoinAccepted: insertSettings.groupJoinAccepted ?? true,
      groupJoinRejected: insertSettings.groupJoinRejected ?? true,
      groupNewPost: insertSettings.groupNewPost ?? true,
      groupNewDiscussion: insertSettings.groupNewDiscussion ?? true,
      // Discussion Forums
      forumNewDiscussion: insertSettings.forumNewDiscussion ?? true,
      forumNewReply: insertSettings.forumNewReply ?? true,
      // Private Messages
      privateMessages: insertSettings.privateMessages ?? true,
      // Member Connections
      connectionRequest: insertSettings.connectionRequest ?? true,
      connectionAccepted: insertSettings.connectionAccepted ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.notificationSettings.set(id, settings);
    return settings;
  }

  async updateNotificationSettings(userId: string, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const existingSettings = Array.from(this.notificationSettings.values()).find(settings => settings.userId === userId);
    if (!existingSettings) return undefined;

    const updatedSettings: NotificationSettings = {
      ...existingSettings,
      ...applyDefined(existingSettings, updates),
      updatedAt: new Date()
    };
    this.notificationSettings.set(existingSettings.id, updatedSettings);
    return updatedSettings;
  }

  // Calendar event methods
  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async getCalendarEventsByUser(userId: string): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const now = new Date();
    const event: CalendarEvent = { 
      id,
      userId: insertEvent.userId,
      title: insertEvent.title,
      description: insertEvent.description || null,
      startTime: insertEvent.startTime,
      endTime: insertEvent.endTime || null,
      eventType: insertEvent.eventType,
      location: insertEvent.location || null,
      attendees: insertEvent.attendees || null,
      reminderMinutes: insertEvent.reminderMinutes || "15",
      isRecurring: insertEvent.isRecurring || false,
      recurrencePattern: insertEvent.recurrencePattern || null,
      relatedEntityId: insertEvent.relatedEntityId || null,
      relatedEntityType: insertEvent.relatedEntityType || null,
      metadata: insertEvent.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = applyDefined(event, updates);
    updatedEvent.updatedAt = new Date();
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async deleteMemberProfile(id: string): Promise<boolean> {
    return this.memberProfiles.delete(id);
  }

  async deleteContractorProfile(id: string): Promise<boolean> {
    return this.contractorProfiles.delete(id);
  }

  async deleteMerchantProfile(id: string): Promise<boolean> {
    return this.merchantProfiles.delete(id);
  }

  async deleteServiceRequest(id: string): Promise<boolean> {
    return this.serviceRequests.delete(id);
  }

  async deleteWorkOrder(id: string): Promise<boolean> {
    return this.workOrders.delete(id);
  }

  async deleteEstimate(id: string): Promise<boolean> {
    return this.estimates.delete(id);
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.invoices.delete(id);
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.deals.delete(id);
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }

  // Community methods
  async getCommunityPosts(limit?: number, offset?: number): Promise<CommunityPost[]> {
    const posts = Array.from(this.communityPosts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit !== undefined) {
      const start = offset || 0;
      return posts.slice(start, start + limit);
    }
    
    return posts;
  }

  async getCommunityPost(id: string): Promise<CommunityPost | undefined> {
    return this.communityPosts.get(id);
  }

  async createCommunityPost(authorId: string, content: string, images?: string[], tags?: string[]): Promise<CommunityPost> {
    const id = randomUUID();
    const now = new Date();
    const post: CommunityPost = {
      id,
      authorId,
      content,
      images: images || null,
      tags: tags || null,
      likeCount: 0,
      commentCount: 0,
      isPublic: true,
      createdAt: now,
      updatedAt: now
    };
    this.communityPosts.set(id, post);
    return post;
  }

  async getCommunityGroups(): Promise<CommunityGroup[]> {
    return Array.from(this.communityGroups.values());
  }

  async getCommunityGroup(id: string): Promise<CommunityGroup | undefined> {
    return this.communityGroups.get(id);
  }

  async createCommunityGroup(name: string, description: string, category: string, createdBy: string): Promise<CommunityGroup> {
    const id = randomUUID();
    const now = new Date();
    const group: CommunityGroup = {
      id,
      name,
      description,
      category,
      isPrivate: false,
      coverImage: null,
      memberCount: 1,
      tags: null,
      location: null,
      createdBy,
      createdAt: now,
      updatedAt: now
    };
    this.communityGroups.set(id, group);
    return group;
  }

  // Gamification - Badges methods
  async getBadge(id: string): Promise<Badge | undefined> {
    return this.badges.get(id);
  }

  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = randomUUID();
    const now = new Date();
    const badge: Badge = {
      id,
      name: insertBadge.name,
      description: insertBadge.description,
      icon: insertBadge.icon,
      category: insertBadge.category,
      rarity: insertBadge.rarity,
      pointsRequired: insertBadge.pointsRequired,
      createdAt: now,
      updatedAt: now
    };
    this.badges.set(id, badge);
    return badge;
  }

  async updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge | undefined> {
    const badge = this.badges.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = applyDefined(badge, updates);
    updatedBadge.updatedAt = new Date();
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }

  async deleteBadge(id: string): Promise<boolean> {
    return this.badges.delete(id);
  }

  // Gamification - Ranks methods
  async getRank(id: string): Promise<Rank | undefined> {
    return this.ranks.get(id);
  }

  async getAllRanks(): Promise<Rank[]> {
    return Array.from(this.ranks.values()).sort((a, b) => a.level - b.level);
  }

  async createRank(insertRank: InsertRank): Promise<Rank> {
    const id = randomUUID();
    const now = new Date();
    const rank: Rank = {
      id,
      name: insertRank.name,
      description: insertRank.description,
      icon: insertRank.icon,
      level: insertRank.level,
      pointsRequired: insertRank.pointsRequired,
      benefits: insertRank.benefits,
      color: insertRank.color,
      createdAt: now,
      updatedAt: now
    };
    this.ranks.set(id, rank);
    return rank;
  }

  async updateRank(id: string, updates: Partial<InsertRank>): Promise<Rank | undefined> {
    const rank = this.ranks.get(id);
    if (!rank) return undefined;
    
    const updatedRank = applyDefined(rank, updates);
    updatedRank.updatedAt = new Date();
    this.ranks.set(id, updatedRank);
    return updatedRank;
  }

  async deleteRank(id: string): Promise<boolean> {
    return this.ranks.delete(id);
  }

  // Gamification - Achievements methods
  async getAchievement(id: string): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const now = new Date();
    const achievement: Achievement = {
      id,
      name: insertAchievement.name,
      description: insertAchievement.description,
      icon: insertAchievement.icon,
      category: insertAchievement.category,
      type: insertAchievement.type,
      pointsAwarded: insertAchievement.pointsAwarded,
      badgeId: insertAchievement.badgeId,
      triggerCondition: insertAchievement.triggerCondition,
      maxProgress: insertAchievement.maxProgress,
      createdAt: now,
      updatedAt: now
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  async updateAchievement(id: string, updates: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement = applyDefined(achievement, updates);
    updatedAchievement.updatedAt = new Date();
    this.achievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  async deleteAchievement(id: string): Promise<boolean> {
    return this.achievements.delete(id);
  }

  // Maintenance Items methods
  async getMaintenanceItem(id: string): Promise<MaintenanceItem | undefined> {
    return this.maintenanceItems.get(id);
  }

  async getAllMaintenanceItems(): Promise<MaintenanceItem[]> {
    return Array.from(this.maintenanceItems.values());
  }

  async createMaintenanceItem(insertItem: InsertMaintenanceItem): Promise<MaintenanceItem> {
    const id = randomUUID();
    const now = new Date();
    const item: MaintenanceItem = {
      id,
      name: insertItem.name,
      description: insertItem.description,
      category: insertItem.category,
      estimatedMinutes: insertItem.estimatedMinutes,
      seasonalWindow: insertItem.seasonalWindow,
      requiredSkills: insertItem.requiredSkills,
      materialsNeeded: insertItem.materialsNeeded,
      toolsNeeded: insertItem.toolsNeeded,
      safetyNotes: insertItem.safetyNotes,
      instructions: insertItem.instructions,
      createdAt: now,
      updatedAt: now
    };
    this.maintenanceItems.set(id, item);
    return item;
  }

  async updateMaintenanceItem(id: string, updates: Partial<InsertMaintenanceItem>): Promise<MaintenanceItem | undefined> {
    const item = this.maintenanceItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = applyDefined(item, updates);
    updatedItem.updatedAt = new Date();
    this.maintenanceItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMaintenanceItem(id: string): Promise<boolean> {
    return this.maintenanceItems.delete(id);
  }

  // Data seeding and initialization
  async seedComprehensiveData(): Promise<void> {
    return seedComprehensiveDataFunction(this);
  }
}

// Storage factory for switching between implementations
export async function createStorage(): Promise<IStorage> {
  const storageBackend = process.env.STORAGE_BACKEND || "memory";
  
  if (storageBackend === "database") {
    console.log("🗄️ Using database storage with PostgreSQL");
    const { DbStorage } = await import("./storage.db.js");
    return new DbStorage();
  } else {
    console.log("💾 Using in-memory storage");
    return new MemStorage();
  }
}

// Export storage instance - initialized asynchronously
let _storage: IStorage | null = null;
export async function getStorage(): Promise<IStorage> {
  if (!_storage) {
    _storage = await createStorage();
  }
  return _storage;
}

// For compatibility with existing synchronous code, create memory storage by default
export const storage = new MemStorage();