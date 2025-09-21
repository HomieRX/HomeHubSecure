import type {
  Achievement,
  Badge,
  CalendarEvent,
  CommunityGroup,
  CommunityPost,
  ContractorProfile,
  Deal,
  Estimate,
  Forum,
  ForumPost,
  ForumPostVote,
  ForumTopic,
  HomeDetails,
  InsertAchievement,
  InsertBadge,
  InsertCalendarEvent,
  InsertCommunityPost,
  InsertContractorProfile,
  InsertDeal,
  InsertEstimate,
  InsertForum,
  InsertForumPost,
  InsertForumPostVote,
  InsertForumTopic,
  InsertHomeDetails,
  InsertInvoice,
  InsertMaintenanceItem,
  InsertMemberProfile,
  InsertMerchantProfile,
  InsertMessage,
  InsertNotification,
  InsertNotificationSettings,
  InsertScheduleAuditLog,
  InsertScheduleConflict,
  InsertServiceRequest,
  InsertTimeSlot,
  InsertUser,
  InsertWorkOrder,
  Invoice,
  LoyaltyPointTransaction,
  MaintenanceItem,
  MemberProfile,
  MerchantProfile,
  Message,
  Notification,
  NotificationSettings,
  Rank,
  ScheduleAuditLog,
  ScheduleConflict,
  ServiceRequest,
  TimeSlot,
  UpsertUser,
  User,
  WorkOrder,
} from '@shared/schema';

export type UserRecord = User;
export type UserCreateInput = InsertUser;
export type UserUpsertInput = UpsertUser;

export type MemberProfileRecord = MemberProfile;
export type MemberProfileCreateInput = InsertMemberProfile;

export type ContractorProfileRecord = ContractorProfile;
export type ContractorProfileCreateInput = InsertContractorProfile;

export type MerchantProfileRecord = MerchantProfile;
export type MerchantProfileCreateInput = InsertMerchantProfile;

export type HomeDetailsRecord = HomeDetails;
export type HomeDetailsCreateInput = InsertHomeDetails;

export type ServiceRequestRecord = ServiceRequest;
export type ServiceRequestCreateInput = InsertServiceRequest;

export type WorkOrderRecord = WorkOrder;
export type WorkOrderCreateInput = InsertWorkOrder;

export type EstimateRecord = Estimate;
export type EstimateCreateInput = InsertEstimate;

export type InvoiceRecord = Invoice;
export type InvoiceCreateInput = InsertInvoice;

export type LoyaltyTransactionRecord = LoyaltyPointTransaction;

export type DealRecord = Deal;
export type DealCreateInput = InsertDeal;

export type MessageRecord = Message;
export type MessageCreateInput = InsertMessage;

export type NotificationRecord = Notification;
export type NotificationCreateInput = InsertNotification;

export type NotificationSettingsRecord = NotificationSettings;
export type NotificationSettingsCreateInput = InsertNotificationSettings;

export type CalendarEventRecord = CalendarEvent;
export type CalendarEventCreateInput = InsertCalendarEvent;

export type CommunityPostRecord = CommunityPost;
export type CommunityPostCreateInput = InsertCommunityPost;
export type CommunityGroupRecord = CommunityGroup;

export type ForumRecord = Forum;
export type ForumCreateInput = InsertForum;
export type ForumTopicRecord = ForumTopic;
export type ForumTopicCreateInput = InsertForumTopic;
export type ForumPostRecord = ForumPost;
export type ForumPostCreateInput = InsertForumPost;
export type ForumPostVoteRecord = ForumPostVote;
export type ForumPostVoteCreateInput = InsertForumPostVote;

export type BadgeRecord = Badge;
export type BadgeCreateInput = InsertBadge;
export type RankRecord = Rank;
export type AchievementRecord = Achievement;
export type AchievementCreateInput = InsertAchievement;

export type MaintenanceItemRecord = MaintenanceItem;
export type MaintenanceItemCreateInput = InsertMaintenanceItem;

export type TimeSlotRecord = TimeSlot;
export type TimeSlotCreateInput = InsertTimeSlot;
export type ScheduleConflictRecord = ScheduleConflict;
export type ScheduleConflictCreateInput = InsertScheduleConflict;
export type ScheduleAuditLogRecord = ScheduleAuditLog;
export type ScheduleAuditLogCreateInput = InsertScheduleAuditLog;
