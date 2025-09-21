// @ts-nocheck
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
  getWorkOrders(): Promise<WorkOrder[]>;
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
  
  // Forum methods (in-memory implementation)
  async getForum(id: string): Promise<Forum | undefined> {
    return this.forums.get(id);
  }

  async getForums(filters?: { isActive?: boolean; forumType?: string; communityGroupId?: string; isPrivate?: boolean }): Promise<Forum[]> {
    let forums = Array.from(this.forums.values());
    if (filters) {
      if (filters.isActive !== undefined) {
        forums = forums.filter(forum => forum.isActive === filters.isActive);
      }
      if (filters.forumType) {
        forums = forums.filter(forum => forum.forumType === filters.forumType);
      }
      if (filters.communityGroupId) {
        forums = forums.filter(forum => forum.communityGroupId === filters.communityGroupId);
      }
      if (filters.isPrivate !== undefined) {
        forums = forums.filter(forum => forum.isPrivate === filters.isPrivate);
      }
    }
    return forums;
  }

  async getForumsByGroup(communityGroupId: string): Promise<Forum[]> {
    return Array.from(this.forums.values()).filter(forum => forum.communityGroupId === communityGroupId);
  }

  async getPublicForums(): Promise<Forum[]> {
    return Array.from(this.forums.values()).filter(forum => !forum.isPrivate && forum.isActive);
  }

  private generateSlug(input: string): string {
    const base = input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return base || randomUUID();
  }

  private updateForumActivity(forumId: string, activityDate: Date, topicId?: string) {
    const forum: any = this.forums.get(forumId);
    if (!forum) return;
    forum.lastActivityAt = activityDate;
    if (topicId) {
      forum.lastTopicId = topicId;
    }
    forum.updatedAt = activityDate;
  }

  async createForum(insertForum: InsertForum): Promise<Forum> {
    const id = randomUUID();
    const now = new Date();
    const forum: any = {
      id,
      name: insertForum.name,
      description: insertForum.description,
      forumType: (insertForum as any).forumType ?? 'general',
      moderation: (insertForum as any).moderation ?? 'open',
      communityGroupId: insertForum.communityGroupId ?? null,
      displayOrder: insertForum.displayOrder ?? 0,
      color: insertForum.color ?? null,
      icon: insertForum.icon ?? null,
      coverImage: (insertForum as any).coverImage ?? null,
      isPrivate: insertForum.isPrivate ?? false,
      membershipRequired: (insertForum as any).membershipRequired ?? null,
      requiredRoles: insertForum.requiredRoles ?? [],
      moderatorIds: insertForum.moderatorIds ?? [],
      tags: insertForum.tags ?? [],
      rules: insertForum.rules ?? null,
      topicCount: 0,
      postCount: 0,
      lastActivityAt: null,
      lastTopicId: null,
      isActive: (insertForum as any).isActive ?? true,
      createdBy: insertForum.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.forums.set(id, forum);
    return forum;
  }

  async updateForum(id: string, updates: Partial<InsertForum>): Promise<Forum | undefined> {
    const forum: any = this.forums.get(id);
    if (!forum) return undefined;
    const updated = applyDefined(forum, updates);
    updated.updatedAt = new Date();
    if (updates.tags) {
      updated.tags = updates.tags;
    }
    if (updates.requiredRoles) {
      updated.requiredRoles = updates.requiredRoles;
    }
    if (updates.moderatorIds) {
      updated.moderatorIds = updates.moderatorIds;
    }
    this.forums.set(id, updated);
    return updated;
  }

  async deleteForum(id: string): Promise<boolean> {
    if (!this.forums.delete(id)) {
      return false;
    }
    const topicsToRemove = Array.from(this.forumTopics.values()).filter(topic => topic.forumId === id);
    for (const topic of topicsToRemove) {
      await this.deleteForumTopic(topic.id);
    }
    return true;
  }

  async getForumTopic(id: string): Promise<ForumTopic | undefined> {
    return this.forumTopics.get(id);
  }

  async getForumTopicBySlug(forumId: string, slug: string): Promise<ForumTopic | undefined> {
    return Array.from(this.forumTopics.values()).find(topic => topic.forumId === forumId && topic.slug === slug);
  }

  async getForumTopics(
    forumId: string,
    filters?: { status?: string; isPinned?: boolean; isLocked?: boolean; isSolved?: boolean; authorId?: string; tags?: string[] },
  ): Promise<ForumTopic[]> {
    let topics = Array.from(this.forumTopics.values()).filter(topic => topic.forumId === forumId);
    if (filters) {
      if (filters.status) topics = topics.filter(topic => topic.status === filters.status);
      if (filters.isPinned !== undefined) topics = topics.filter(topic => topic.isPinned === filters.isPinned);
      if (filters.isLocked !== undefined) topics = topics.filter(topic => topic.isLocked === filters.isLocked);
      if (filters.isSolved !== undefined) topics = topics.filter(topic => topic.isSolved === filters.isSolved);
      if (filters.authorId) topics = topics.filter(topic => topic.authorId === filters.authorId);
      if (filters.tags && filters.tags.length > 0) {
        topics = topics.filter(topic => (topic.tags || []).some(tag => filters.tags!.includes(tag)));
      }
    }
    topics.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return topics;
  }

  async getTopicsByAuthor(authorId: string): Promise<ForumTopic[]> {
    return Array.from(this.forumTopics.values()).filter(topic => topic.authorId === authorId);
  }

  async getRecentTopics(limit = 10): Promise<ForumTopic[]> {
    const topics = Array.from(this.forumTopics.values());
    topics.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return topics.slice(0, limit);
  }

  async getTrendingTopics(limit = 10): Promise<ForumTopic[]> {
    const topics = Array.from(this.forumTopics.values());
    topics.sort((a: any, b: any) => (b.postCount || 0) - (a.postCount || 0));
    return topics.slice(0, limit);
  }

  async createForumTopic(topicData: InsertForumTopic): Promise<ForumTopic> {
    const forum = this.forums.get(topicData.forumId);
    if (!forum) {
      throw new Error(`Forum ${topicData.forumId} not found`);
    }

    const id = randomUUID();
    const now = new Date();
    const slug = topicData.slug ?? this.generateSlug(topicData.title);
    const topic: any = {
      id,
      forumId: topicData.forumId,
      title: topicData.title,
      description: topicData.description ?? null,
      slug,
      status: topicData.status ?? 'active',
      isPinned: topicData.isPinned ?? false,
      isLocked: topicData.isLocked ?? false,
      isSolved: topicData.isSolved ?? false,
      authorId: topicData.authorId,
      viewCount: topicData.viewCount ?? 0,
      postCount: topicData.postCount ?? 0,
      participantCount: topicData.participantCount ?? 1,
      lastPostId: topicData.lastPostId ?? null,
      lastPostAt: topicData.lastPostAt ?? now,
      lastPostAuthorId: topicData.lastPostAuthorId ?? topicData.authorId,
      acceptedAnswerId: topicData.acceptedAnswerId ?? null,
      bountyPoints: topicData.bountyPoints ?? 0,
      tags: topicData.tags ?? [],
      metadata: topicData.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      __participants: new Set<string>([topicData.authorId]),
    };

    this.forumTopics.set(id, topic);
    forum.topicCount = (forum.topicCount || 0) + 1;
    this.updateForumActivity(forum.id, now, id);
    return topic;
  }

  async updateForumTopic(id: string, updates: Partial<InsertForumTopic>): Promise<ForumTopic | undefined> {
    const topic: any = this.forumTopics.get(id);
    if (!topic) return undefined;
    const updated = applyDefined(topic, updates);
    if (updates.slug) {
      updated.slug = updates.slug;
    }
    if (updates.tags) {
      updated.tags = updates.tags;
    }
    updated.updatedAt = new Date();
    this.forumTopics.set(id, updated);
    this.updateForumActivity(updated.forumId, updated.updatedAt, id);
    return updated;
  }

  async pinTopic(id: string, isPinned: boolean): Promise<ForumTopic | undefined> {
    return this.updateForumTopic(id, { isPinned });
  }

  async lockTopic(id: string, isLocked: boolean): Promise<ForumTopic | undefined> {
    return this.updateForumTopic(id, { isLocked });
  }

  async solveTopic(id: string, isSolved: boolean): Promise<ForumTopic | undefined> {
    return this.updateForumTopic(id, { isSolved });
  }

  async incrementTopicViews(id: string): Promise<void> {
    const topic: any = this.forumTopics.get(id);
    if (!topic) return;
    topic.viewCount = (topic.viewCount || 0) + 1;
    topic.updatedAt = new Date();
    this.updateForumActivity(topic.forumId, topic.updatedAt, id);
  }

  async deleteForumTopic(id: string): Promise<boolean> {
    const topic = this.forumTopics.get(id);
    if (!topic) return false;
    this.forumTopics.delete(id);
    const forum = this.forums.get(topic.forumId);
    if (forum) {
      forum.topicCount = Math.max(0, (forum.topicCount || 1) - 1);
      forum.postCount = Math.max(0, (forum.postCount || 0) - (topic.postCount || 0));
      this.updateForumActivity(forum.id, new Date());
    }
    const postsToRemove = Array.from(this.forumPosts.values()).filter(post => post.topicId === id);
    for (const post of postsToRemove) {
      await this.deleteForumPost(post.id);
    }
    return true;
  }

  async getForumPost(id: string): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }

  async getForumPosts(forumId: string): Promise<ForumPost[]> {
    const posts = Array.from(this.forumPosts.values()).filter(post => post.forumId === forumId);
    posts.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return posts;
  }

  async getPostsByAuthor(authorId: string): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values()).filter(post => post.authorId === authorId);
  }

  async getTopLevelPosts(topicId: string): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values()).filter(post => post.topicId === topicId && !post.parentPostId);
  }

  async getPostReplies(parentPostId: string): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values()).filter(post => post.parentPostId === parentPostId);
  }

  async getPostThread(postId: string): Promise<ForumPost[]> {
    const root = this.forumPosts.get(postId);
    if (!root) return [];
    const topicPosts = Array.from(this.forumPosts.values()).filter(post => post.topicId === root.topicId);
    topicPosts.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return topicPosts;
  }

  async createForumPost(postData: InsertForumPost): Promise<ForumPost> {
    const topic: any = this.forumTopics.get(postData.topicId);
    const forum: any = this.forums.get(postData.forumId);
    if (!topic || !forum) {
      throw new Error('Forum or topic not found');
    }
    const id = randomUUID();
    const now = new Date();
    const parent = postData.parentPostId ? this.forumPosts.get(postData.parentPostId) : null;
    const level = parent ? (parent.level || 0) + 1 : 0;
    const path = parent ? `${parent.path || parent.id}.${id}` : id;
    const post: any = {
      id,
      topicId: postData.topicId,
      forumId: postData.forumId,
      parentPostId: postData.parentPostId ?? null,
      postType: postData.postType ?? 'reply',
      content: postData.content,
      contentHtml: postData.contentHtml ?? null,
      attachments: postData.attachments ?? [],
      images: postData.images ?? [],
      authorId: postData.authorId,
      status: postData.status ?? 'active',
      isEdited: false,
      editedAt: null,
      editReason: null,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      isAcceptedAnswer: false,
      acceptedAt: null,
      acceptedBy: null,
      replyCount: 0,
      level,
      path,
      ipAddress: (postData as any).ipAddress ?? null,
      userAgent: (postData as any).userAgent ?? null,
      metadata: postData.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.forumPosts.set(id, post);

    topic.postCount = (topic.postCount || 0) + 1;
    if (!topic.__participants) topic.__participants = new Set<string>();
    topic.__participants.add(post.authorId);
    topic.participantCount = topic.__participants.size;
    topic.lastPostId = id;
    topic.lastPostAt = now;
    topic.lastPostAuthorId = post.authorId;
    topic.updatedAt = now;

    if (forum) {
      forum.postCount = (forum.postCount || 0) + 1;
      this.updateForumActivity(forum.id, now, topic.id);
    }

    if (parent) {
      parent.replyCount = (parent.replyCount || 0) + 1;
      parent.updatedAt = now;
    }

    return post;
  }

  async updateForumPost(id: string, updates: Partial<InsertForumPost>): Promise<ForumPost | undefined> {
    const post: any = this.forumPosts.get(id);
    if (!post) return undefined;
    const updated = applyDefined(post, updates);
    updated.updatedAt = new Date();
    if (updates.content !== undefined) {
      updated.isEdited = true;
      updated.editReason = updates.editReason ?? post.editReason ?? null;
      updated.editedAt = new Date();
    }
    this.forumPosts.set(id, updated);
    return updated;
  }

  async markPostAsAnswer(postId: string, topicId: string, acceptedBy: string): Promise<ForumPost | undefined> {
    const post: any = this.forumPosts.get(postId);
    const topic: any = this.forumTopics.get(topicId);
    if (!post || !topic) return undefined;
    post.isAcceptedAnswer = true;
    post.acceptedAt = new Date();
    post.acceptedBy = acceptedBy;
    topic.acceptedAnswerId = postId;
    topic.isSolved = true;
    topic.updatedAt = new Date();
    this.updateForumActivity(topic.forumId, topic.updatedAt, topic.id);
    return post;
  }

  async unmarkPostAsAnswer(postId: string, topicId: string): Promise<ForumPost | undefined> {
    const post: any = this.forumPosts.get(postId);
    const topic: any = this.forumTopics.get(topicId);
    if (!post || !topic) return undefined;
    post.isAcceptedAnswer = false;
    post.acceptedAt = null;
    post.acceptedBy = null;
    if (topic.acceptedAnswerId === postId) {
      topic.acceptedAnswerId = null;
    }
    topic.isSolved = false;
    topic.updatedAt = new Date();
    this.updateForumActivity(topic.forumId, topic.updatedAt, topic.id);
    return post;
  }

  async deleteForumPost(id: string): Promise<boolean> {
    const post = this.forumPosts.get(id);
    if (!post) return false;
    this.forumPosts.delete(id);

    const topic: any = this.forumTopics.get(post.topicId);
    const forum: any = this.forums.get(post.forumId);
    if (topic) {
      topic.postCount = Math.max(0, (topic.postCount || 1) - 1);
      topic.updatedAt = new Date();
      if (topic.acceptedAnswerId === id) {
        topic.acceptedAnswerId = null;
        topic.isSolved = false;
      }
    }
    if (forum) {
      forum.postCount = Math.max(0, (forum.postCount || 1) - 1);
      this.updateForumActivity(forum.id, new Date(), topic ? topic.id : undefined);
    }
    if (post.parentPostId) {
      const parent = this.forumPosts.get(post.parentPostId);
      if (parent) {
        parent.replyCount = Math.max(0, (parent.replyCount || 1) - 1);
        parent.updatedAt = new Date();
      }
    }
    const voteKeys = Array.from(this.forumPostVotes.keys()).filter(key => key.startsWith(`${id}:`));
    for (const key of voteKeys) {
      this.forumPostVotes.delete(key);
    }
    return true;
  }

  async getPostVote(postId: string, userId: string): Promise<ForumPostVote | undefined> {
    return this.forumPostVotes.get(`${postId}:${userId}`);
  }

  async getPostVotes(postId: string): Promise<ForumPostVote[]> {
    return Array.from(this.forumPostVotes.values()).filter(vote => vote.postId === postId);
  }

  async createPostVote(vote: InsertForumPostVote): Promise<ForumPostVote> {
    const key = `${vote.postId}:${vote.userId}`;
    const existing = this.forumPostVotes.get(key);
    if (existing) {
      return existing;
    }
    const newVote: any = {
      id: randomUUID(),
      postId: vote.postId,
      userId: vote.userId,
      voteType: vote.voteType ?? 'up',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.forumPostVotes.set(key, newVote);
    this.applyVoteToPost(newVote.postId, newVote.voteType, null);
    return newVote;
  }

  async updatePostVote(postId: string, userId: string, voteType: 'up' | 'down'): Promise<ForumPostVote | undefined> {
    const key = `${postId}:${userId}`;
    const vote: any = this.forumPostVotes.get(key);
    if (!vote) return undefined;
    if (vote.voteType === voteType) return vote;
    this.applyVoteToPost(postId, voteType, vote.voteType);
    vote.voteType = voteType;
    vote.updatedAt = new Date();
    this.forumPostVotes.set(key, vote);
    return vote;
  }

  async removePostVote(postId: string, userId: string): Promise<boolean> {
    const key = `${postId}:${userId}`;
    const vote = this.forumPostVotes.get(key);
    if (!vote) return false;
    this.applyVoteToPost(postId, null, vote.voteType);
    this.forumPostVotes.delete(key);
    return true;
  }

  private applyVoteToPost(postId: string, nextVote: 'up' | 'down' | null, prevVote: 'up' | 'down' | null) {
    const post: any = this.forumPosts.get(postId);
    if (!post) return;
    if (prevVote === 'up') post.upvotes = Math.max(0, (post.upvotes || 1) - 1);
    if (prevVote === 'down') post.downvotes = Math.max(0, (post.downvotes || 1) - 1);
    if (nextVote === 'up') post.upvotes = (post.upvotes || 0) + 1;
    if (nextVote === 'down') post.downvotes = (post.downvotes || 0) + 1;
    post.score = (post.upvotes || 0) - (post.downvotes || 0);
    post.updatedAt = new Date();
  }

  async getPostScore(postId: string): Promise<{ upvotes: number; downvotes: number; score: number }> {
    const post: any = this.forumPosts.get(postId);
    if (!post) {
      return { upvotes: 0, downvotes: 0, score: 0 };
    }
    return {
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      score: post.score || 0,
    };
  }

  async getForumStats(forumId: string): Promise<{ topicCount: number; postCount: number; participantCount: number }> {
    const forum = this.forums.get(forumId);
    if (!forum) {
      return { topicCount: 0, postCount: 0, participantCount: 0 };
    }
    const topics = await this.getForumTopics(forumId);
    const posts = await this.getForumPosts(forumId);
    const participants = new Set<string>();
    topics.forEach(topic => participants.add(topic.authorId));
    posts.forEach(post => participants.add(post.authorId));
    return {
      topicCount: forum.topicCount || topics.length,
      postCount: forum.postCount || posts.length,
      participantCount: participants.size,
    };
  }

  async getTopicStats(topicId: string): Promise<{ postCount: number; participantCount: number; viewCount: number }> {
    const topic: any = this.forumTopics.get(topicId);
    if (!topic) {
      return { postCount: 0, participantCount: 0, viewCount: 0 };
    }
    const posts = Array.from(this.forumPosts.values()).filter(post => post.topicId === topicId);
    const participants = new Set<string>(posts.map(post => post.authorId));
    participants.add(topic.authorId);
    return {
      postCount: topic.postCount || posts.length,
      participantCount: topic.participantCount || participants.size,
      viewCount: topic.viewCount || 0,
    };
  }

  async getUserForumActivity(userId: string): Promise<{ topicCount: number; postCount: number; votesReceived: number }> {
    const topicCount = Array.from(this.forumTopics.values()).filter(topic => topic.authorId === userId).length;
    const postCount = Array.from(this.forumPosts.values()).filter(post => post.authorId === userId).length;
    const votesReceived = Array.from(this.forumPostVotes.values()).filter(vote => {
      const post = this.forumPosts.get(vote.postId);
      return post?.authorId === userId;
    }).length;
    return { topicCount, postCount, votesReceived };
  }

  async moderatePost(postId: string, status: string): Promise<ForumPost | undefined> {
    const post: any = this.forumPosts.get(postId);
    if (!post) return undefined;
    post.status = status;
    post.updatedAt = new Date();
    return post;
  }

  async flagPost(postId: string, userId: string, reason: string): Promise<void> {
    const post: any = this.forumPosts.get(postId);
    if (!post) return;
    post.status = 'flagged';
    post.metadata = post.metadata || {};
    const flags = post.metadata.flags || [];
    flags.push({ userId, reason, flaggedAt: new Date() });
    post.metadata.flags = flags;
    post.updatedAt = new Date();
  }

  async getFlaggedPosts(forumId?: string): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values()).filter(post => post.status === 'flagged' && (!forumId || post.forumId === forumId));
  }

  // Scheduling methods (in-memory implementation)
  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    return this.timeSlots.get(id);
  }

  async getContractorTimeSlots(contractorId: string, startDate?: Date, endDate?: Date): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(slot => {
      if (slot.contractorId !== contractorId) return false;
      const slotStart = new Date(slot.startTime);
      if (startDate && slotStart < startDate) return false;
      if (endDate && slotStart > endDate) return false;
      return true;
    });
  }

  async getOverlappingTimeSlots(contractorId: string, startTime: Date, endTime: Date): Promise<TimeSlot[]> {
    const rangeStart = startTime.getTime();
    const rangeEnd = endTime.getTime();
    return Array.from(this.timeSlots.values()).filter(slot => {
      if (slot.contractorId !== contractorId) return false;
      const slotStart = new Date(slot.startTime).getTime();
      const slotEnd = new Date(slot.endTime).getTime();
      return slotStart < rangeEnd && slotEnd > rangeStart;
    });
  }

  async createTimeSlot(insertSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const now = new Date();
    const slot: any = {
      id,
      contractorId: insertSlot.contractorId,
      slotDate: insertSlot.slotDate ? new Date(insertSlot.slotDate) : new Date(insertSlot.startTime),
      startTime: new Date(insertSlot.startTime),
      endTime: new Date(insertSlot.endTime),
      slotType: insertSlot.slotType ?? 'standard',
      duration: insertSlot.duration ?? '2_hour',
      customDurationMinutes: insertSlot.customDurationMinutes ?? null,
      isAvailable: insertSlot.isAvailable ?? true,
      isRecurring: insertSlot.isRecurring ?? false,
      recurringPattern: insertSlot.recurringPattern ?? null,
      notes: insertSlot.notes ?? null,
      maxConcurrentBookings: insertSlot.maxConcurrentBookings ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.timeSlots.set(id, slot);
    return slot;
  }

  async updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const slot: any = this.timeSlots.get(id);
    if (!slot) return undefined;
    const updated = applyDefined(slot, updates);
    if (updates.startTime) updated.startTime = new Date(updates.startTime);
    if (updates.endTime) updated.endTime = new Date(updates.endTime);
    if (updates.slotDate) updated.slotDate = new Date(updates.slotDate);
    updated.updatedAt = new Date();
    this.timeSlots.set(id, updated);
    return updated;
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    return this.timeSlots.delete(id);
  }

  async getOverlappingWorkOrders(contractorId: string, startTime: Date, endTime: Date): Promise<WorkOrder[]> {
    const rangeStart = startTime.getTime();
    const rangeEnd = endTime.getTime();
    return Array.from(this.workOrders.values()).filter(order => {
      if (order.contractorId !== contractorId) return false;
      if (!order.scheduledStartDate || !order.scheduledEndDate) return false;
      const orderStart = new Date(order.scheduledStartDate).getTime();
      const orderEnd = new Date(order.scheduledEndDate).getTime();
      return orderStart < rangeEnd && orderEnd > rangeStart;
    });
  }

  async getWorkOrdersByDateRange(contractorId: string, startDate: Date, endDate: Date): Promise<WorkOrder[]> {
    const rangeStart = startDate.getTime();
    const rangeEnd = endDate.getTime();
    return Array.from(this.workOrders.values()).filter(order => {
      if (order.contractorId !== contractorId) return false;
      if (!order.scheduledStartDate) return false;
      const orderStart = new Date(order.scheduledStartDate).getTime();
      return orderStart >= rangeStart && orderStart <= rangeEnd;
    });
  }

  async getScheduleConflict(id: string): Promise<ScheduleConflict | undefined> {
    return this.scheduleConflicts.get(id);
  }

  async getScheduleConflictsByWorkOrder(workOrderId: string): Promise<ScheduleConflict[]> {
    return Array.from(this.scheduleConflicts.values()).filter(conflict => conflict.workOrderId === workOrderId);
  }

  async getScheduleConflictsByContractor(contractorId: string, includeResolved = false): Promise<ScheduleConflict[]> {
    return Array.from(this.scheduleConflicts.values()).filter(conflict => {
      if (conflict.contractorId !== contractorId) return false;
      if (!includeResolved && conflict.isResolved) return false;
      return true;
    });
  }

  async createScheduleConflict(conflictData: InsertScheduleConflict): Promise<ScheduleConflict> {
    const id = randomUUID();
    const now = new Date();
    const conflict: any = {
      id,
      conflictType: conflictData.conflictType,
      workOrderId: conflictData.workOrderId ?? null,
      contractorId: conflictData.contractorId,
      conflictStart: new Date(conflictData.conflictStart),
      conflictEnd: new Date(conflictData.conflictEnd),
      conflictDescription: conflictData.conflictDescription ?? null,
      detectionMethod: conflictData.detectionMethod ?? null,
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: now,
      updatedAt: now,
    };
    this.scheduleConflicts.set(id, conflict);
    return conflict;
  }

  async updateScheduleConflict(id: string, updates: Partial<InsertScheduleConflict>): Promise<ScheduleConflict | undefined> {
    const conflict: any = this.scheduleConflicts.get(id);
    if (!conflict) return undefined;
    const updated = applyDefined(conflict, updates);
    if (updates.conflictStart) updated.conflictStart = new Date(updates.conflictStart);
    if (updates.conflictEnd) updated.conflictEnd = new Date(updates.conflictEnd);
    updated.updatedAt = new Date();
    this.scheduleConflicts.set(id, updated);
    return updated;
  }

  async resolveScheduleConflict(id: string, resolvedBy: string, resolutionNotes: string): Promise<ScheduleConflict | undefined> {
    const conflict: any = this.scheduleConflicts.get(id);
    if (!conflict) return undefined;
    conflict.isResolved = true;
    conflict.resolvedBy = resolvedBy;
    conflict.resolutionNotes = resolutionNotes;
    conflict.resolvedAt = new Date();
    conflict.updatedAt = new Date();
    this.scheduleConflicts.set(id, conflict);
    return conflict;
  }

  async getScheduleAuditLog(id: string): Promise<ScheduleAuditLog | undefined> {
    return this.scheduleAuditLogs.get(id);
  }

  async getScheduleAuditLogsByEntity(entityType: string, entityId: string): Promise<ScheduleAuditLog[]> {
    return Array.from(this.scheduleAuditLogs.values()).filter(log => log.entityType === entityType && log.entityId === entityId);
  }

  async getScheduleAuditLogsByUser(userId: string, limit = 50): Promise<ScheduleAuditLog[]> {
    const logs = Array.from(this.scheduleAuditLogs.values()).filter(log => log.userId === userId);
    logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs.slice(0, limit);
  }

  async createScheduleAuditLog(entry: InsertScheduleAuditLog): Promise<ScheduleAuditLog> {
    const id = randomUUID();
    const now = new Date();
    const log: any = {
      id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: entry.userId,
      details: entry.details ?? {},
      createdAt: now,
    };
    this.scheduleAuditLogs.set(id, log);
    return log;
  }

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
  private forums: Map<string, Forum>;
  private forumTopics: Map<string, ForumTopic>;
  private forumPosts: Map<string, ForumPost>;
  private forumPostVotes: Map<string, ForumPostVote>;
  private timeSlots: Map<string, TimeSlot>;
  private scheduleConflicts: Map<string, ScheduleConflict>;
  private scheduleAuditLogs: Map<string, ScheduleAuditLog>;


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
    this.forums = new Map();
    this.forumTopics = new Map();
    this.forumPosts = new Map();
    this.forumPostVotes = new Map();
    this.timeSlots = new Map();
    this.scheduleConflicts = new Map();
    this.scheduleAuditLogs = new Map();
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

  async getWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
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
      attachments: insertEstimate.attachments ?? null,
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
      workOrderId: insertInvoice.workOrderId ?? null,
      estimateId: insertInvoice.estimateId ?? null,
      memberId: insertInvoice.memberId,
      invoiceNumber,
      pdfUrl: insertInvoice.pdfUrl ?? null,
      subtotal: insertInvoice.subtotal,
      tax: insertInvoice.tax ?? "0.00",
      total: insertInvoice.total,
      loyaltyPointsUsed: insertInvoice.loyaltyPointsUsed ?? 0,
      loyaltyPointsValue: insertInvoice.loyaltyPointsValue ?? "0.00",
      amountDue: insertInvoice.amountDue,
      loyaltyPointsEarned: insertInvoice.loyaltyPointsEarned ?? 0,
      status: insertInvoice.status ?? "draft",
      dueDate: insertInvoice.dueDate,
      paidAt: insertInvoice.paidAt ?? null,
      paymentMethod: insertInvoice.paymentMethod ?? null,
      transactionId: insertInvoice.transactionId ?? null,
      lineItems: insertInvoice.lineItems,
      notes: insertInvoice.notes ?? null,
      sentAt: insertInvoice.sentAt ?? null,
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
      transactionId,
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
      name: insertBadge.name ?? '',
      description: insertBadge.description ?? '',
      icon: insertBadge.icon ?? '',
      category: insertBadge.category ?? 'general',
      rarity: insertBadge.rarity ?? 'common',
      pointsRequired: insertBadge.pointsRequired ?? null,
      isActive: true,
      displayOrder: 0,
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
      name: insertRank.name ?? '',
      description: insertRank.description ?? '',
      icon: insertRank.icon ?? '',
      level: insertRank.level ?? 0,
      pointsRequired: insertRank.pointsRequired ?? 0,
      benefits: insertRank.benefits ?? null,
      color: insertRank.color ?? '#6B7280',
      isActive: true,
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
      name: insertAchievement.name ?? '',
      description: insertAchievement.description ?? '',
      icon: insertAchievement.icon ?? '',
      category: insertAchievement.category ?? 'general',
      type: insertAchievement.type ?? 'one_time',
      pointsAwarded: insertAchievement.pointsAwarded ?? 0,
      badgeId: insertAchievement.badgeId ?? null,
      triggerCondition: insertAchievement.triggerCondition,
      maxProgress: insertAchievement.maxProgress ?? null,
      isActive: true,
      displayOrder: 0,
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
      name: insertItem.name ?? '',
      description: insertItem.description ?? '',
      category: insertItem.category ?? 'general',
      estimatedMinutes: insertItem.estimatedMinutes ?? 0,
      seasonalWindow: insertItem.seasonalWindow ?? null,
      requiredSkills: insertItem.requiredSkills ?? null,
      materialsNeeded: insertItem.materialsNeeded ?? null,
      toolsNeeded: insertItem.toolsNeeded ?? null,
      safetyNotes: insertItem.safetyNotes ?? null,
      instructions: insertItem.instructions ?? null,
      displayOrder: 0,
      isActive: true,
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
    return seedComprehensiveDataFunction(this as unknown as IStorage);
  }
}

// Storage factory for switching between implementations
export async function createStorage(): Promise<IStorage> {
  const storageBackend = process.env.STORAGE_BACKEND || "memory";
  
  if (storageBackend === "database") {
    console.log("🗄️ Using database storage with PostgreSQL");
    const { DbStorage } = await import("./storage.db.js");
    return new DbStorage() as unknown as IStorage;
  } else {
    console.log("💾 Using in-memory storage");
    return new MemStorage() as unknown as IStorage;
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
