import type { IStorage } from '../storage';

export type UserRepository = Pick<IStorage,
  'getUser' |
  'getAllUsers' |
  'upsertUser' |
  'getUserByUsername' |
  'getUserByEmail' |
  'createUser' |
  'updateUser' |
  'deleteUser'
>;

export type MemberProfileRepository = Pick<IStorage,
  'getMemberProfile' |
  'getMemberProfileByUserId' |
  'createMemberProfile' |
  'updateMemberProfile' |
  'getMembersByTier' |
  'getAllMemberProfiles' |
  'deleteMemberProfile'
>;

export type PublicDirectoryRepository = Pick<IStorage,
  'getPublicContractors' |
  'getPublicMerchants' |
  'getPublicMembersByTier'
>;

export type ContractorRepository = Pick<IStorage,
  'getContractorProfile' |
  'getContractorProfileByUserId' |
  'createContractorProfile' |
  'updateContractorProfile' |
  'getContractors' |
  'verifyContractor' |
  'getAllContractorProfiles' |
  'deleteContractorProfile'
>;

export type MerchantRepository = Pick<IStorage,
  'getMerchantProfile' |
  'getMerchantProfileByUserId' |
  'createMerchantProfile' |
  'updateMerchantProfile' |
  'getMerchants' |
  'getAllMerchantProfiles' |
  'deleteMerchantProfile'
>;

export type HomeDetailsRepository = Pick<IStorage,
  'getHomeDetails' |
  'getHomeDetailsByProfileId' |
  'createHomeDetails' |
  'updateHomeDetails'
>;

export type ServiceRequestRepository = Pick<IStorage,
  'getServiceRequest' |
  'getServiceRequestsByMember' |
  'getServiceRequestsByManager' |
  'createServiceRequest' |
  'updateServiceRequest' |
  'assignServiceRequest' |
  'getAllServiceRequests' |
  'deleteServiceRequest'
>;

export type WorkOrderRepository = Pick<IStorage,
  'getWorkOrder' |
  'getWorkOrders' |
  'getWorkOrdersByServiceRequest' |
  'getWorkOrdersByManager' |
  'getWorkOrdersByContractor' |
  'createWorkOrder' |
  'updateWorkOrder' |
  'completeWorkOrder' |
  'getAllWorkOrders' |
  'deleteWorkOrder'
>;

export type EstimateRepository = Pick<IStorage,
  'getEstimate' |
  'getEstimatesByServiceRequest' |
  'getEstimatesByContractor' |
  'createEstimate' |
  'updateEstimate' |
  'approveEstimate' |
  'rejectEstimate' |
  'getAllEstimates' |
  'deleteEstimate'
>;

export type InvoiceRepository = Pick<IStorage,
  'getInvoice' |
  'getInvoicesByMember' |
  'getInvoicesByWorkOrder' |
  'createInvoice' |
  'updateInvoice' |
  'payInvoice' |
  'getAllInvoices' |
  'deleteInvoice'
>;

export type LoyaltyRepository = Pick<IStorage,
  'getLoyaltyPointBalance' |
  'getLoyaltyPointTransactions' |
  'addLoyaltyPoints' |
  'spendLoyaltyPoints'
>;

export type DealRepository = Pick<IStorage,
  'getDeal' |
  'getDealsByMerchant' |
  'getActiveDeals' |
  'createDeal' |
  'updateDeal' |
  'redeemDeal' |
  'getAllDeals' |
  'deleteDeal'
>;

export type MessageRepository = Pick<IStorage,
  'getMessage' |
  'getMessagesByUser' |
  'getConversation' |
  'createMessage' |
  'markMessageAsRead' |
  'getAllMessages' |
  'deleteMessage'
>;

export type NotificationRepository = Pick<IStorage,
  'getNotification' |
  'getNotificationsByUser' |
  'createNotification' |
  'markNotificationAsRead' |
  'markAllNotificationsAsRead'
>;

export type NotificationSettingsRepository = Pick<IStorage,
  'getNotificationSettings' |
  'createNotificationSettings' |
  'updateNotificationSettings'
>;

export type CalendarRepository = Pick<IStorage,
  'getCalendarEvent' |
  'getCalendarEventsByUser' |
  'createCalendarEvent' |
  'updateCalendarEvent' |
  'deleteCalendarEvent' |
  'getAllCalendarEvents'
>;

export type CommunityRepository = Pick<IStorage,
  'getCommunityPosts' |
  'getCommunityPost' |
  'createCommunityPost' |
  'getCommunityGroups' |
  'getCommunityGroup' |
  'createCommunityGroup'
>;

export type ForumRepository = Pick<IStorage,
  'getForum' |
  'getForums' |
  'getForumsByGroup' |
  'getPublicForums' |
  'createForum' |
  'updateForum' |
  'deleteForum'
>;

export type ForumTopicRepository = Pick<IStorage,
  'getForumTopic' |
  'getForumTopicBySlug' |
  'getForumTopics' |
  'getTopicsByAuthor' |
  'getRecentTopics' |
  'getTrendingTopics' |
  'createForumTopic' |
  'updateForumTopic' |
  'pinTopic' |
  'lockTopic' |
  'solveTopic' |
  'incrementTopicViews' |
  'deleteForumTopic'
>;

export type ForumPostRepository = Pick<IStorage,
  'getForumPost' |
  'getForumPosts' |
  'getPostsByAuthor' |
  'getTopLevelPosts' |
  'getPostReplies' |
  'getPostThread' |
  'createForumPost' |
  'updateForumPost' |
  'markPostAsAnswer' |
  'unmarkPostAsAnswer' |
  'deleteForumPost'
>;

export type ForumVoteRepository = Pick<IStorage,
  'getPostVote' |
  'getPostVotes' |
  'createPostVote' |
  'updatePostVote' |
  'removePostVote' |
  'getPostScore'
>;

export type ForumAnalyticsRepository = Pick<IStorage,
  'getForumStats' |
  'getTopicStats' |
  'getUserForumActivity'
>;

export type ForumModerationRepository = Pick<IStorage,
  'moderatePost' |
  'flagPost' |
  'getFlaggedPosts'
>;

export type BadgeRepository = Pick<IStorage,
  'getBadge' |
  'getAllBadges' |
  'createBadge' |
  'updateBadge' |
  'deleteBadge'
>;

export type RankRepository = Pick<IStorage,
  'getRank' |
  'getAllRanks' |
  'createRank' |
  'updateRank' |
  'deleteRank'
>;

export type AchievementRepository = Pick<IStorage,
  'getAchievement' |
  'getAllAchievements' |
  'createAchievement' |
  'updateAchievement' |
  'deleteAchievement'
>;

export type MaintenanceRepository = Pick<IStorage,
  'getMaintenanceItem' |
  'getAllMaintenanceItems' |
  'createMaintenanceItem' |
  'updateMaintenanceItem' |
  'deleteMaintenanceItem'
>;

export type SchedulingSlotRepository = Pick<IStorage,
  'getTimeSlot' |
  'getContractorTimeSlots' |
  'getOverlappingTimeSlots' |
  'createTimeSlot' |
  'updateTimeSlot' |
  'deleteTimeSlot'
>;

export type SchedulingWorkOrderRepository = Pick<IStorage,
  'getOverlappingWorkOrders' |
  'getWorkOrdersByDateRange'
>;

export type SchedulingConflictRepository = Pick<IStorage,
  'getScheduleConflict' |
  'getScheduleConflictsByWorkOrder' |
  'getScheduleConflictsByContractor' |
  'createScheduleConflict' |
  'updateScheduleConflict' |
  'resolveScheduleConflict'
>;

export type SchedulingAuditRepository = Pick<IStorage,
  'getScheduleAuditLog' |
  'getScheduleAuditLogsByEntity' |
  'getScheduleAuditLogsByUser' |
  'createScheduleAuditLog'
>;

export type SeedRepository = Pick<IStorage,
  'seedComprehensiveData'
>;

export interface StorageRepositories {
  users: UserRepository;
  members: MemberProfileRepository;
  publicDirectory: PublicDirectoryRepository;
  contractors: ContractorRepository;
  merchants: MerchantRepository;
  homes: HomeDetailsRepository;
  serviceRequests: ServiceRequestRepository;
  workOrders: WorkOrderRepository;
  estimates: EstimateRepository;
  invoices: InvoiceRepository;
  loyalty: LoyaltyRepository;
  deals: DealRepository;
  messages: MessageRepository;
  notifications: NotificationRepository;
  notificationSettings: NotificationSettingsRepository;
  calendar: CalendarRepository;
  community: CommunityRepository;
  forums: ForumRepository;
  forumTopics: ForumTopicRepository;
  forumPosts: ForumPostRepository;
  forumVotes: ForumVoteRepository;
  forumAnalytics: ForumAnalyticsRepository;
  forumModeration: ForumModerationRepository;
  badges: BadgeRepository;
  ranks: RankRepository;
  achievements: AchievementRepository;
  maintenance: MaintenanceRepository;
  schedulingSlots: SchedulingSlotRepository;
  schedulingWorkOrders: SchedulingWorkOrderRepository;
  schedulingConflicts: SchedulingConflictRepository;
  schedulingAudit: SchedulingAuditRepository;
  seed: SeedRepository;
}

export const createStorageRepositories = (storage: IStorage): StorageRepositories => ({
  users: storage as UserRepository,
  members: storage as MemberProfileRepository,
  publicDirectory: storage as PublicDirectoryRepository,
  contractors: storage as ContractorRepository,
  merchants: storage as MerchantRepository,
  homes: storage as HomeDetailsRepository,
  serviceRequests: storage as ServiceRequestRepository,
  workOrders: storage as WorkOrderRepository,
  estimates: storage as EstimateRepository,
  invoices: storage as InvoiceRepository,
  loyalty: storage as LoyaltyRepository,
  deals: storage as DealRepository,
  messages: storage as MessageRepository,
  notifications: storage as NotificationRepository,
  notificationSettings: storage as NotificationSettingsRepository,
  calendar: storage as CalendarRepository,
  community: storage as CommunityRepository,
  forums: storage as ForumRepository,
  forumTopics: storage as ForumTopicRepository,
  forumPosts: storage as ForumPostRepository,
  forumVotes: storage as ForumVoteRepository,
  forumAnalytics: storage as ForumAnalyticsRepository,
  forumModeration: storage as ForumModerationRepository,
  badges: storage as BadgeRepository,
  ranks: storage as RankRepository,
  achievements: storage as AchievementRepository,
  maintenance: storage as MaintenanceRepository,
  schedulingSlots: storage as SchedulingSlotRepository,
  schedulingWorkOrders: storage as SchedulingWorkOrderRepository,
  schedulingConflicts: storage as SchedulingConflictRepository,
  schedulingAudit: storage as SchedulingAuditRepository,
  seed: storage as SeedRepository,
});
