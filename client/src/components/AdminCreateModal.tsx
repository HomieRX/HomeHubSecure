import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  insertUserSchema,
  insertMemberProfileSchema,
  insertContractorProfileSchema,
  insertMerchantProfileSchema,
  insertServiceRequestSchema,
  insertWorkOrderSchema,
  insertEstimateSchema,
  insertInvoiceSchema,
  insertDealSchema,
  insertMessageSchema,
  insertCalendarEventSchema,
  insertBadgeSchema,
  insertRankSchema,
  insertAchievementSchema,
  insertMaintenanceItemSchema,
  insertForumSchema,
  insertForumTopicSchema,
  insertForumPostSchema,
  insertForumPostVoteSchema,
  type InsertUser,
  type InsertMemberProfile,
  type InsertContractorProfile,
  type InsertMerchantProfile,
  type InsertServiceRequest,
  type InsertWorkOrder,
  type InsertEstimate,
  type InsertInvoice,
  type InsertDeal,
  type InsertMessage,
  type InsertCalendarEvent,
  type InsertBadge,
  type InsertRank,
  type InsertAchievement,
  type InsertMaintenanceItem,
  type InsertForum,
  type InsertForumTopic,
  type InsertForumPost,
  type InsertForumPostVote
} from "@shared/schema";

type GenericFormValues = Record<string, unknown>;

type EntityType = 
  | "users" 
  | "memberProfiles" 
  | "contractorProfiles" 
  | "merchantProfiles" 
  | "serviceRequests" 
  | "workOrders" 
  | "estimates" 
  | "invoices"
  | "deals" 
  | "messages" 
  | "calendarEvents"
  | "badges"
  | "ranks"
  | "achievements"
  | "maintenanceItems"
  | "forums"
  | "forumTopics"
  | "forumPosts"
  | "forumPostVotes";

interface AdminCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  title: string;
}

const getSchemaForEntity = (entityType: EntityType) => {
  switch (entityType) {
    case "users": return insertUserSchema;
    case "memberProfiles": return insertMemberProfileSchema;
    case "contractorProfiles": return insertContractorProfileSchema;
    case "merchantProfiles": return insertMerchantProfileSchema;
    case "serviceRequests": return insertServiceRequestSchema;
    case "workOrders": return insertWorkOrderSchema;
    case "estimates": return insertEstimateSchema;
    case "invoices": return insertInvoiceSchema;
    case "deals": return insertDealSchema;
    case "messages": return insertMessageSchema;
    case "calendarEvents": return insertCalendarEventSchema;
    case "badges": return insertBadgeSchema;
    case "ranks": return insertRankSchema;
    case "achievements": return insertAchievementSchema;
    case "maintenanceItems": return insertMaintenanceItemSchema;
    case "forums": return insertForumSchema;
    case "forumTopics": return insertForumTopicSchema;
    case "forumPosts": return insertForumPostSchema;
    case "forumPostVotes": return insertForumPostVoteSchema;
    default: return insertUserSchema;
  }
};

const getDefaultValues = (entityType: EntityType) => {
  switch (entityType) {
    case "users":
      return {
        email: "",
        firstName: "",
        lastName: "",
        role: "homeowner",
        isActive: true
      };
    case "memberProfiles":
      return {
        userId: "",
        nickname: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        membershipTier: "HomeHUB",
        loyaltyPoints: 0,
        bio: "",
        location: "",
        address: "",
        city: "",
        state: "",
        zipCode: ""
      };
    case "contractorProfiles":
      return {
        userId: "",
        businessName: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        serviceRadius: 25,
        hourlyRate: "",
        licenseNumber: "",
        licenseType: "",
        licenseExpiryDate: null,
        insuranceProvider: "",
        insurancePolicyNumber: "",
        insuranceExpiryDate: null,
        bondingProvider: "",
        bondingAmount: "",
        bio: "",
        specialties: [],
        certifications: [],
        yearsExperience: 0,
        portfolioImages: [],
        isActive: true
      };
    case "merchantProfiles":
      return {
        userId: "",
        businessName: "",
        ownerName: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        businessType: "",
        businessDescription: "",
        businessLicense: "",
        taxId: "",
        serviceArea: "",
        specialties: [],
        acceptedPaymentMethods: [],
        businessImages: [],
        logoUrl: "",
        isActive: true
      };
    case "serviceRequests":
      return {
        memberId: "",
        serviceType: "FixiT",
        category: "Handyman",
        title: "",
        description: "",
        urgency: "normal",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        preferredDateTime: null,
        isSeasonalService: false,
        seasonalWindow: "",
        slotDuration: 60,
        requiredSkills: [],
        estimatedCost: "",
        requiresEscrow: false,
        escrowAmount: "",
        pointsReward: 0,
        membershipBenefitApplied: false,
        loyaltyDiscountApplied: "0.00",
        images: [],
        memberNotes: "",
        serviceMetadata: {}
      };
    case "workOrders":
      return {
        serviceRequestId: "",
        homeManagerId: "",
        contractorId: "",
        workOrderNumber: "",
        scheduledStartDate: null,
        scheduledEndDate: null,
        workDescription: "",
        materialsNeeded: {},
        laborHours: "",
        workNotes: "",
        beforeImages: [],
        afterImages: []
      };
    case "estimates":
      return {
        serviceRequestId: "",
        contractorId: "",
        estimateNumber: "",
        title: "",
        description: "",
        laborCost: "",
        materialCost: "",
        additionalCosts: "0.00",
        totalCost: "",
        estimatedHours: "",
        startDate: null,
        completionDate: null,
        materials: {},
        laborBreakdown: {},
        terms: "",
        validUntil: null,
        notes: ""
      };
    case "invoices":
      return {
        workOrderId: "",
        memberId: "",
        invoiceNumber: "",
        subtotal: "",
        tax: "0.00",
        total: "",
        loyaltyPointsUsed: 0,
        loyaltyPointsValue: "0.00",
        amountDue: "",
        loyaltyPointsEarned: 0,
        dueDate: null,
        paymentMethod: "",
        paymentTransactionId: "",
        lineItems: {},
        notes: ""
      };
    case "deals":
      return {
        merchantId: "",
        title: "",
        description: "",
        category: "",
        discountType: "percentage",
        discountValue: "",
        originalPrice: "",
        finalPrice: "",
        validFrom: null,
        validUntil: null,
        isExclusive: false,
        membershipRequired: "HomeHUB",
        maxUses: 100,
        tags: [],
        termsAndConditions: "",
        images: [],
        isActive: true
      };
    case "messages":
      return {
        senderId: "",
        receiverId: "",
        subject: "",
        content: "",
        isRead: false,
        threadId: "",
        attachments: {},
        messageType: "general",
        relatedEntityId: "",
        relatedEntityType: ""
      };
    case "calendarEvents":
      return {
        userId: "",
        title: "",
        description: "",
        startTime: null,
        endTime: null,
        eventType: "",
        location: "",
        attendees: {},
        reminderMinutes: "15",
        isRecurring: false,
        recurrencePattern: "",
        relatedEntityId: "",
        relatedEntityType: "",
        metadata: {}
      };
    case "badges":
      return {
        name: "",
        description: "",
        icon: "",
        category: "",
        rarity: "common",
        pointsRequired: null
      };
    case "ranks":
      return {
        name: "",
        description: "",
        icon: "",
        level: 1,
        pointsRequired: 0,
        benefits: [],
        color: "#6B7280"
      };
    case "achievements":
      return {
        name: "",
        description: "",
        icon: "",
        category: "",
        type: "one_time",
        pointsAwarded: 0,
        badgeId: null,
        triggerCondition: {
          type: "service_count",
          value: 1
        },
        maxProgress: null
      };
    case "maintenanceItems":
      return {
        name: "",
        description: "",
        category: "",
        estimatedMinutes: 30,
        seasonalWindow: null,
        requiredSkills: [],
        materialsNeeded: [],
        toolsNeeded: [],
        safetyNotes: "",
        instructions: ""
      };
    case "forums":
      return {
        name: "",
        description: "",
        forumType: "general",
        moderation: "open",
        displayOrder: 0,
        color: "",
        icon: "",
        coverImage: "",
        isPrivate: false,
        membershipRequired: null,
        requiredRoles: [],
        moderatorIds: [],
        tags: [],
        rules: "",
        isActive: true,
        createdBy: ""
      };
    case "forumTopics":
      return {
        forumId: "",
        title: "",
        description: "",
        slug: "",
        status: "active",
        isPinned: false,
        isLocked: false,
        isSolved: false,
        authorId: "",
        bountyPoints: 0,
        tags: [],
        metadata: {}
      };
    case "forumPosts":
      return {
        topicId: "",
        forumId: "",
        parentPostId: null,
        postType: "reply",
        content: "",
        attachments: [],
        images: [],
        authorId: "",
        status: "active",
        editReason: "",
        metadata: {}
      };
    case "forumPostVotes":
      return {
        postId: "",
        userId: "",
        voteType: "up"
      };
    default:
      return {};
  }
};

export default function AdminCreateModal({ isOpen, onClose, entityType, title }: AdminCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const schema = getSchemaForEntity(entityType);
  const defaultValues = getDefaultValues(entityType);

  const form = useForm<GenericFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as GenericFormValues
  });

  // Get users for dropdowns
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isOpen && (
      entityType === "memberProfiles" || 
      entityType === "contractorProfiles" || 
      entityType === "merchantProfiles" ||
      entityType === "messages" ||
      entityType === "calendarEvents"
    )
  });

  // Get member profiles for dropdowns
  const { data: memberProfiles } = useQuery({
    queryKey: ["/api/admin/memberProfiles"],
    enabled: isOpen && (
      entityType === "serviceRequests" || 
      entityType === "invoices"
    )
  });

  // Get contractor profiles for dropdowns
  const { data: contractorProfiles } = useQuery({
    queryKey: ["/api/admin/contractorProfiles"],
    enabled: isOpen && (
      entityType === "workOrders" || 
      entityType === "estimates"
    )
  });

  // Get service requests for dropdowns
  const { data: serviceRequests } = useQuery({
    queryKey: ["/api/admin/serviceRequests"],
    enabled: isOpen && (
      entityType === "workOrders" || 
      entityType === "estimates"
    )
  });

  // Get work orders for dropdowns
  const { data: workOrders } = useQuery({
    queryKey: ["/api/admin/workOrders"],
    enabled: isOpen && entityType === "invoices"
  });

  // Get merchant profiles for dropdowns
  const { data: merchantProfiles } = useQuery({
    queryKey: ["/api/admin/merchantProfiles"],
    enabled: isOpen && entityType === "deals"
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch(`/api/admin/${entityType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error(`Failed to create ${title}`);
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/counts"] });
      toast({
        title: "Success",
        description: `${title} created successfully`,
      });
      onClose();
      form.reset(defaultValues as GenericFormValues);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || `Failed to create ${title}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Transform datetime-local strings to proper Date objects for date fields
      const transformedData = { ...data };
      
      // Define date fields for each entity type
      const dateFieldsMap: Record<EntityType, string[]> = {
        contractorProfiles: ['licenseExpiryDate', 'insuranceExpiryDate'],
        serviceRequests: ['preferredDateTime'],
        workOrders: ['scheduledStartDate', 'scheduledEndDate'],
        estimates: ['startDate', 'completionDate', 'validUntil'],
        invoices: ['dueDate'],
        deals: ['validFrom', 'validUntil'],
        calendarEvents: ['startTime', 'endTime'],
        users: [],
        memberProfiles: [],
        merchantProfiles: [],
        messages: [],
        badges: [],
        ranks: [],
        achievements: [],
        maintenanceItems: [],
        forums: [],
        forumTopics: [],
        forumPosts: [],
        forumPostVotes: []
      };
      
      // Transform date fields for current entity type
      const dateFields = dateFieldsMap[entityType] || [];
      dateFields.forEach(field => {
        if (transformedData[field] && transformedData[field] !== '') {
          // Convert datetime-local string to Date object, then to ISO string
          const dateValue = new Date(transformedData[field]);
          if (!isNaN(dateValue.getTime())) {
            transformedData[field] = dateValue.toISOString();
          } else {
            // If invalid date, set to null
            transformedData[field] = null;
          }
        } else {
          // If empty or null, ensure it's null
          transformedData[field] = null;
        }
      });
      
      await createMutation.mutateAsync(transformedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset(defaultValues);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid={`modal-create-${entityType}`}>
        <DialogHeader>
          <DialogTitle>Create New {title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderFormFields(form, entityType, { users, memberProfiles, contractorProfiles, serviceRequests, workOrders, merchantProfiles })}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-create"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to render form fields for each entity type
function renderFormFields(form: any, entityType: EntityType, data: any) {
  const { users, memberProfiles, contractorProfiles, serviceRequests, workOrders, merchantProfiles } = data;

  switch (entityType) {
    case "users":
      return (
        <>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="user@example.com" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} data-testid="input-firstName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} data-testid="input-lastName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="homeowner">Homeowner</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-isActive"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active User</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </>
      );

    case "memberProfiles":
      return (
        <>
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-userId">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.firstName} {user.lastName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nickname *</FormLabel>
                <FormControl>
                  <Input placeholder="Johnny" {...field} data-testid="input-nickname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} data-testid="input-firstName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} data-testid="input-lastName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="member@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="membershipTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membership Tier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-membershipTier">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="HomeHUB">HomeHUB</SelectItem>
                    <SelectItem value="HomePRO">HomePRO</SelectItem>
                    <SelectItem value="HomeHERO">HomeHERO</SelectItem>
                    <SelectItem value="HomeGURU">HomeGURU</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell us about yourself..." {...field} data-testid="textarea-bio" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} data-testid="input-state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="94105" {...field} data-testid="input-zipCode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      );

    case "contractorProfiles":
      return (
        <>
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-userId">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.firstName} {user.lastName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name *</FormLabel>
                <FormControl>
                  <Input placeholder="ABC Contracting LLC" {...field} data-testid="input-businessName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} data-testid="input-firstName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} data-testid="input-lastName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="contractor@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} data-testid="input-state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="94105" {...field} data-testid="input-zipCode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceRadius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Radius (miles)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="25" {...field} data-testid="input-serviceRadius" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="75.00" {...field} data-testid="input-hourlyRate" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC123456" {...field} data-testid="input-licenseNumber" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type *</FormLabel>
                  <FormControl>
                    <Input placeholder="General Contractor" {...field} data-testid="input-licenseType" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="licenseExpiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Expiry Date *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-licenseExpiryDate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="insuranceProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider *</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Insurance Co." {...field} data-testid="input-insuranceProvider" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurancePolicyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="POL123456789" {...field} data-testid="input-insurancePolicyNumber" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="insuranceExpiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Expiry Date *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-insuranceExpiryDate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell us about your business and experience..." {...field} data-testid="textarea-bio" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearsExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} data-testid="input-yearsExperience" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    case "merchantProfiles":
      return (
        <>
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-userId">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.firstName} {user.lastName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name *</FormLabel>
                <FormControl>
                  <Input placeholder="ABC Hardware Store" {...field} data-testid="input-businessName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} data-testid="input-ownerName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="merchant@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.merchant.com" {...field} data-testid="input-website" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} data-testid="input-state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="94105" {...field} data-testid="input-zipCode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type *</FormLabel>
                  <FormControl>
                    <Input placeholder="Hardware Store, Garden Center, etc." {...field} data-testid="input-businessType" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Area</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco Bay Area" {...field} data-testid="input-serviceArea" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="businessDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your business and services..." {...field} data-testid="textarea-businessDescription" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business License *</FormLabel>
                  <FormControl>
                    <Input placeholder="BL123456789" {...field} data-testid="input-businessLicense" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="12-3456789" {...field} data-testid="input-taxId" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-isActive"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active Merchant</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </>
      );

    case "serviceRequests":
      return (
        <>
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-memberId">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {memberProfiles?.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nickname} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Fix leaky kitchen faucet" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-serviceType">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FixiT">FixiT</SelectItem>
                      <SelectItem value="PreventiT">PreventiT</SelectItem>
                      <SelectItem value="HandleiT">HandleiT</SelectItem>
                      <SelectItem value="CheckiT">CheckiT</SelectItem>
                      <SelectItem value="LoyalizeiT">LoyalizeiT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Handyman">Handyman</SelectItem>
                      <SelectItem value="Basic Plumbing">Basic Plumbing</SelectItem>
                      <SelectItem value="Basic Electrical">Basic Electrical</SelectItem>
                      <SelectItem value="Dishwasher">Dishwasher</SelectItem>
                      <SelectItem value="Oven">Oven</SelectItem>
                      <SelectItem value="Microwave">Microwave</SelectItem>
                      <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                      <SelectItem value="Sink Disposal">Sink Disposal</SelectItem>
                      <SelectItem value="Clothes Washer">Clothes Washer</SelectItem>
                      <SelectItem value="Clothes Dryer">Clothes Dryer</SelectItem>
                      <SelectItem value="Water Heater">Water Heater</SelectItem>
                      <SelectItem value="Basic Irrigation">Basic Irrigation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the issue or work needed..." {...field} data-testid="textarea-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-urgency">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Date/Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-preferredDateTime" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} data-testid="input-state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="94105" {...field} data-testid="input-zipCode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="memberNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes or special instructions..." {...field} data-testid="textarea-memberNotes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    case "workOrders":
      return (
        <>
          <FormField
            control={form.control}
            name="serviceRequestId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Request *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-serviceRequestId">
                      <SelectValue placeholder="Select service request" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceRequests?.map((request: any) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.title} - {request.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="homeManagerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Manager *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-homeManagerId">
                      <SelectValue placeholder="Select home manager" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.filter((user: any) => user.role === 'admin')?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-contractorId">
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contractorProfiles?.map((contractor: any) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.businessName} - {contractor.firstName} {contractor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the work to be performed..." {...field} data-testid="textarea-workDescription" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduledStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Start Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-scheduledStartDate" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled End Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-scheduledEndDate" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="laborHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Labor Hours</FormLabel>
                <FormControl>
                  <Input type="number" step="0.25" placeholder="4.0" {...field} data-testid="input-laborHours" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes about the work..." {...field} data-testid="textarea-workNotes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    case "estimates":
      return (
        <>
          <FormField
            control={form.control}
            name="serviceRequestId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Request *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-serviceRequestId">
                      <SelectValue placeholder="Select service request" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceRequests?.map((request: any) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.title} - {request.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-contractorId">
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contractorProfiles?.map((contractor: any) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.businessName} - {contractor.firstName} {contractor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Kitchen faucet repair estimate" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detailed description of the estimate..." {...field} data-testid="textarea-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="laborCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor Cost *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="150.00" {...field} data-testid="input-laborCost" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="materialCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Cost *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="75.00" {...field} data-testid="input-materialCost" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="225.00" {...field} data-testid="input-totalCost" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.25" placeholder="2.0" {...field} data-testid="input-estimatedHours" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid Until *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-validUntil" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Payment terms, warranty information, etc..." {...field} data-testid="textarea-terms" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    case "invoices":
      return (
        <>
          <FormField
            control={form.control}
            name="workOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Order *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-workOrderId">
                      <SelectValue placeholder="Select work order" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workOrders?.map((workOrder: any) => (
                      <SelectItem key={workOrder.id} value={workOrder.id}>
                        {workOrder.workOrderNumber} - {workOrder.workDescription}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-memberId">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {memberProfiles?.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nickname} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="subtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtotal *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="200.00" {...field} data-testid="input-subtotal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="16.00" {...field} data-testid="input-tax" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="216.00" {...field} data-testid="input-total" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-dueDate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Payment instructions or additional notes..." {...field} data-testid="textarea-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    case "deals":
      return (
        <>
          <FormField
            control={form.control}
            name="merchantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Merchant *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-merchantId">
                      <SelectValue placeholder="Select merchant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {merchantProfiles?.map((merchant: any) => (
                      <SelectItem key={merchant.id} value={merchant.id}>
                        {merchant.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="20% Off All Garden Tools" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detailed description of the deal..." {...field} data-testid="textarea-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <FormControl>
                  <Input placeholder="Garden & Outdoor" {...field} data-testid="input-category" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-discountType">
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="bogo">Buy One Get One</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Value *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="20.00" {...field} data-testid="input-discountValue" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="validFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid From *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-validFrom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid Until *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-validUntil" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="termsAndConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Deal terms, restrictions, etc..." {...field} data-testid="textarea-termsAndConditions" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isExclusive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-isExclusive"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Exclusive Deal</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-isActive"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Deal</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </>
      );

    case "messages":
      return (
        <>
          <FormField
            control={form.control}
            name="senderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sender *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-senderId">
                      <SelectValue placeholder="Select sender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="receiverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receiver *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-receiverId">
                      <SelectValue placeholder="Select receiver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Message subject" {...field} data-testid="input-subject" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Type your message here..." {...field} data-testid="textarea-content" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="messageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-messageType">
                      <SelectValue placeholder="Select message type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="service_related">Service Related</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    case "calendarEvents":
      return (
        <>
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-userId">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Service appointment" {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Event description..." {...field} data-testid="textarea-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-startTime" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} data-testid="input-endTime" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type *</FormLabel>
                  <FormControl>
                    <Input placeholder="appointment, meeting, reminder" {...field} data-testid="input-eventType" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State" {...field} data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="reminderMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reminder (minutes before)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-reminderMinutes">
                      <SelectValue placeholder="Select reminder time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-isRecurring"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recurring Event</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </>
      );

    default:
      return <div>Form fields for {entityType} coming soon...</div>;
  }
}