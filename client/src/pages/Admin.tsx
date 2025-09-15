import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  type User,
  type MemberProfile,
  type ContractorProfile,
  type MerchantProfile,
  type ServiceRequest,
  type WorkOrder,
  type Estimate,
  type Invoice,
  type Deal,
  type Message,
  type CalendarEvent
} from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  UserPlus, 
  Building2, 
  Wrench, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Calendar,
  Gift,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  Loader2
} from "lucide-react";

type EntityType = 
  | "users" 
  | "memberProfiles" 
  | "contractorProfiles" 
  | "merchantProfiles" 
  | "homeDetails"
  | "serviceRequests" 
  | "workOrders" 
  | "estimates" 
  | "invoices"
  | "deals" 
  | "messages" 
  | "notifications" 
  | "calendarEvents"
  | "loyaltyPointTransactions"
  | "communityPosts"
  | "communityGroups";

const adminSections = [
  {
    id: "users" as EntityType,
    title: "Users",
    description: "Manage platform users and roles",
    icon: Users,
    color: "blue"
  },
  {
    id: "memberProfiles" as EntityType,
    title: "Member Profiles", 
    description: "Homeowner profiles and membership tiers",
    icon: UserPlus,
    color: "green"
  },
  {
    id: "contractorProfiles" as EntityType,
    title: "Contractor Profiles",
    description: "Contractor verification and management",
    icon: Wrench,
    color: "orange"
  },
  {
    id: "merchantProfiles" as EntityType,
    title: "Merchant Profiles",
    description: "Business partner management",
    icon: Building2,
    color: "purple"
  },
  {
    id: "serviceRequests" as EntityType,
    title: "Service Requests",
    description: "Platform service request management", 
    icon: Settings,
    color: "red"
  },
  {
    id: "workOrders" as EntityType,
    title: "Work Orders",
    description: "Active work order tracking",
    icon: FileText,
    color: "yellow"
  },
  {
    id: "estimates" as EntityType,
    title: "Estimates",
    description: "Contractor estimate management",
    icon: DollarSign,
    color: "teal"
  },
  {
    id: "invoices" as EntityType,
    title: "Invoices",
    description: "Payment and billing management",
    icon: DollarSign,
    color: "pink"
  },
  {
    id: "deals" as EntityType,
    title: "Deals & Offers",
    description: "Merchant deal management",
    icon: Gift,
    color: "indigo"
  },
  {
    id: "messages" as EntityType,
    title: "Messages",
    description: "Platform communication system",
    icon: MessageSquare,
    color: "cyan"
  },
  {
    id: "calendarEvents" as EntityType,
    title: "Calendar Events",
    description: "Scheduling and event management",
    icon: Calendar,
    color: "amber"
  }
];

// Schema helpers for different entity types
function getSchemaForEntity(entityType: EntityType) {
  switch (entityType) {
    case "users":
      return insertUserSchema;
    case "memberProfiles":
      return insertMemberProfileSchema.extend({
        userId: z.string().min(1, "User ID is required")
      });
    case "contractorProfiles":
      return insertContractorProfileSchema.extend({
        userId: z.string().min(1, "User ID is required")
      });
    case "merchantProfiles":
      return insertMerchantProfileSchema.extend({
        userId: z.string().min(1, "User ID is required")
      });
    case "serviceRequests":
      return insertServiceRequestSchema.extend({
        memberId: z.string().min(1, "Member ID is required"),
        address: z.string().min(1, "Address is required"),
        state: z.string().min(1, "State is required")
      });
    case "workOrders":
      return insertWorkOrderSchema.extend({
        serviceRequestId: z.string().min(1, "Service Request ID is required"),
        homeManagerId: z.string().min(1, "Home Manager ID is required")
      });
    case "estimates":
      return insertEstimateSchema.extend({
        serviceRequestId: z.string().min(1, "Service Request ID is required"),
        contractorId: z.string().min(1, "Contractor ID is required"),
        validUntil: z.string().min(1, "Valid until date is required")
      });
    case "invoices":
      return insertInvoiceSchema.extend({
        workOrderId: z.string().min(1, "Work Order ID is required"),
        memberId: z.string().min(1, "Member ID is required"),
        lineItems: z.array(z.object({
          description: z.string(),
          amount: z.number()
        })).min(1, "At least one line item is required"),
        dueDate: z.string().min(1, "Due date is required")
      });
    case "deals":
      return insertDealSchema.extend({
        merchantId: z.string().min(1, "Merchant ID is required"),
        validFrom: z.string().min(1, "Valid from date is required"),
        validUntil: z.string().min(1, "Valid until date is required")
      });
    case "messages":
      return insertMessageSchema.extend({
        senderId: z.string().min(1, "Sender ID is required"),
        receiverId: z.string().min(1, "Receiver ID is required")
      });
    case "calendarEvents":
      return insertCalendarEventSchema.extend({
        userId: z.string().min(1, "User ID is required"),
        startTime: z.string().min(1, "Start time is required")
      });
    default:
      return z.object({
        name: z.string().min(1, "Name is required"),
        title: z.string().optional()
      });
  }
}

function AdminEntityList({ entityType }: { entityType: EntityType }) {
  const { toast } = useToast();
  const { data: items = [] as any[], isLoading } = useQuery({
    queryKey: [`/api/admin/${entityType}`],
    enabled: !!entityType
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    return items.filter((item: any) => {
      const searchableText = [
        item.name,
        item.title,
        item.businessName,
        item.nickname,
        item.email,
        item.description,
        item.businessDescription,
        item.content,
        item.role,
        item.membershipTier,
        item.status
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm.toLowerCase());
    });
  }, [items, searchTerm]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/${entityType}/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}`] });
      toast({
        title: "Success",
        description: `${entityType.slice(0, -1)} deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete ${entityType.slice(0, -1)}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${entityType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            data-testid={`input-search-${entityType}`}
          />
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
          data-testid={`button-create-${entityType}`}
        >
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? `No ${entityType} found matching "${searchTerm}"` : `No ${entityType} found`}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateForm(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First {entityType.slice(0, -1)}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item: any) => (
            <Card key={item.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {item.name || item.title || item.businessName || item.nickname || `${entityType} #${item.id?.slice(0, 8)}`}
                      </span>
                      {item.isActive !== undefined && (
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                      {item.role && (
                        <Badge variant="outline">{item.role}</Badge>
                      )}
                      {item.membershipTier && (
                        <Badge variant="secondary">{item.membershipTier}</Badge>
                      )}
                      {item.status && (
                        <Badge variant="outline">{item.status}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.email || item.description || item.businessDescription || item.content || "No description"}
                    </p>
                    {item.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {entityType.slice(0, -1)}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showCreateForm && (
        <AdminCreateForm
          entityType={entityType}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {editingItem && (
        <AdminEditForm
          entityType={entityType}
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function AdminCreateForm({ entityType, onClose }: { entityType: EntityType; onClose: () => void }) {
  const { toast } = useToast();
  const schema = getSchemaForEntity(entityType);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(entityType)
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/admin/${entityType}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}`] });
      toast({
        title: "Success",
        description: `${entityType.slice(0, -1)} created successfully`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create ${entityType.slice(0, -1)}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New {entityType.slice(0, -1)}</CardTitle>
        <CardDescription>
          Add a new {entityType.slice(0, -1).toLowerCase()} to the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderFormFields(entityType, form)}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid={`button-submit-create-${entityType}`}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create {entityType.slice(0, -1)}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AdminEditForm({ entityType, item, onClose }: { entityType: EntityType; item: any; onClose: () => void }) {
  const { toast } = useToast();
  const schema = getSchemaForEntity(entityType);
  
  const form = useForm({
    resolver: zodResolver(schema.partial()),
    defaultValues: item
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/admin/${entityType}/${item.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}`] });
      toast({
        title: "Success",
        description: `${entityType.slice(0, -1)} updated successfully`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update ${entityType.slice(0, -1)}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit {entityType.slice(0, -1)}</CardTitle>
        <CardDescription>
          Update the {entityType.slice(0, -1).toLowerCase()} information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderFormFields(entityType, form)}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid={`button-submit-edit-${entityType}`}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update {entityType.slice(0, -1)}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function getDefaultValues(entityType: EntityType) {
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
        email: "",
        membershipTier: "HomeHUB",
        bio: ""
      };
    case "serviceRequests":
      return {
        memberId: "",
        category: "",
        title: "",
        description: "",
        urgency: "normal",
        address: "",
        city: "",
        state: "",
        zipCode: ""
      };
    default:
      return {
        name: "",
        title: ""
      };
  }
}

function renderFormFields(entityType: EntityType, form: any) {
  switch (entityType) {
    case "users":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-firstName" />
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
                    <Input {...field} data-testid="input-lastName" />
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active User</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Enable this user to access the platform
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-isActive"
                  />
                </FormControl>
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
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-userId" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-nickname" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} data-testid="input-email" />
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
                  <Textarea {...field} data-testid="textarea-bio" />
                </FormControl>
                <FormMessage />
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
                <FormLabel>Member ID</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-memberId" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-title" />
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Handyman">Handyman</SelectItem>
                      <SelectItem value="Dishwasher">Dishwasher</SelectItem>
                      <SelectItem value="Oven">Oven</SelectItem>
                      <SelectItem value="Microwave">Microwave</SelectItem>
                      <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                      <SelectItem value="Basic Electrical">Basic Electrical</SelectItem>
                      <SelectItem value="Basic Plumbing">Basic Plumbing</SelectItem>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} data-testid="textarea-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-4 gap-4">
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
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-city" />
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
                    <Input {...field} data-testid="input-state" />
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
                    <Input {...field} data-testid="input-zipCode" />
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
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );

    default:
      return (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Custom form for {entityType} will be implemented here.
          </p>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
  }
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<EntityType>("users");

  // Check if user is admin
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  if (!currentUser || (currentUser as any)?.role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You need administrator privileges to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-admin">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive platform management and data administration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {adminSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card
              key={section.id}
              className={`cursor-pointer hover-elevate transition-all ${
                activeTab === section.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setActiveTab(section.id)}
              data-testid={`card-section-${section.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-${section.color}-100 dark:bg-${section.color}-900`}>
                    <IconComponent className={`h-5 w-5 text-${section.color}-600 dark:text-${section.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const activeSection = adminSections.find(s => s.id === activeTab);
              const IconComponent = activeSection?.icon || Users;
              return (
                <>
                  <IconComponent className="h-5 w-5" />
                  {activeSection?.title || "Management"}
                </>
              );
            })()}
          </CardTitle>
          <CardDescription>
            {adminSections.find(s => s.id === activeTab)?.description || "Manage platform data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminEntityList entityType={activeTab} />
        </CardContent>
      </Card>
    </div>
  );
}