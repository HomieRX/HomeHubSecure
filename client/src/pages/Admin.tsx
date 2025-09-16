import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminDataTable } from "@/components/AdminDataTable";
import AdminCreateModal from "@/components/AdminCreateModal";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Users,
  UserPlus,
  Wrench,
  Building2,
  Settings,
  FileText,
  DollarSign,
  Receipt,
  Gift,
  MessageSquare,
  Calendar,
  Menu
} from "lucide-react";

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
  | "calendarEvents";

interface EntityConfig {
  id: EntityType;
  title: string;
  description: string;
  icon: any;
  columns: any[];
}

// Define table columns for each entity type
const entityConfigs: Record<EntityType, EntityConfig> = {
  users: {
    id: "users",
    title: "Users",
    description: "Manage platform users and their roles",
    icon: Users,
    columns: [
      { key: "email", label: "Email", sortable: true },
      { key: "firstName", label: "First Name", sortable: true },
      { key: "lastName", label: "Last Name", sortable: true },
      { key: "role", label: "Role", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "isActive", label: "Status", sortable: true, render: (value: boolean) => <Badge variant={value ? "default" : "secondary"}>{value ? "Active" : "Inactive"}</Badge> },
      { key: "createdAt", label: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  memberProfiles: {
    id: "memberProfiles",
    title: "Member Profiles",
    description: "Homeowner profiles and membership management",
    icon: UserPlus,
    columns: [
      { key: "nickname", label: "Nickname", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "membershipTier", label: "Tier", sortable: true, render: (value: string) => <Badge variant="secondary">{value}</Badge> },
      { key: "loyaltyPoints", label: "Points", sortable: true },
      { key: "location", label: "Location", sortable: true },
      { key: "joinedAt", label: "Joined", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  contractorProfiles: {
    id: "contractorProfiles",
    title: "Contractor Profiles",
    description: "Contractor verification and management",
    icon: Wrench,
    columns: [
      { key: "businessName", label: "Business Name", sortable: true },
      { key: "email", label: "Email", sortable: true },
      { key: "serviceRadius", label: "Service Radius", sortable: true },
      { key: "hourlyRate", label: "Hourly Rate", sortable: true, render: (value: number) => `$${value}` },
      { key: "isVerified", label: "Verified", sortable: true, render: (value: boolean) => <Badge variant={value ? "default" : "secondary"}>{value ? "Verified" : "Pending"}</Badge> },
      { key: "rating", label: "Rating", sortable: true, render: (value: number) => `${value}/5` },
      { key: "isActive", label: "Status", sortable: true }
    ]
  },
  merchantProfiles: {
    id: "merchantProfiles",
    title: "Merchant Profiles",
    description: "Business partner and merchant management",
    icon: Building2,
    columns: [
      { key: "businessName", label: "Business Name", sortable: true },
      { key: "businessType", label: "Type", sortable: true },
      { key: "website", label: "Website", sortable: true },
      { key: "serviceArea", label: "Service Area", sortable: true },
      { key: "isVerified", label: "Verified", sortable: true, render: (value: boolean) => <Badge variant={value ? "default" : "secondary"}>{value ? "Verified" : "Pending"}</Badge> },
      { key: "rating", label: "Rating", sortable: true, render: (value: number) => `${value}/5` },
      { key: "isActive", label: "Status", sortable: true }
    ]
  },
  serviceRequests: {
    id: "serviceRequests",
    title: "Service Requests",
    description: "Platform service request management",
    icon: Settings,
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "category", label: "Category", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "urgency", label: "Urgency", sortable: true, render: (value: string) => <Badge variant={value === "high" ? "destructive" : value === "medium" ? "default" : "secondary"}>{value}</Badge> },
      { key: "status", label: "Status", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "address", label: "Address", sortable: true },
      { key: "createdAt", label: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  workOrders: {
    id: "workOrders",
    title: "Work Orders",
    description: "Active work order tracking and management",
    icon: FileText,
    columns: [
      { key: "workOrderNumber", label: "Work Order #", sortable: true },
      { key: "workDescription", label: "Description", sortable: true },
      { key: "status", label: "Status", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "scheduledStartDate", label: "Start Date", sortable: true, render: (value: string) => value ? new Date(value).toLocaleDateString() : "Not scheduled" },
      { key: "completionDate", label: "Completion", sortable: true, render: (value: string) => value ? new Date(value).toLocaleDateString() : "Pending" },
      { key: "createdAt", label: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  estimates: {
    id: "estimates",
    title: "Estimates",
    description: "Contractor estimate management",
    icon: DollarSign,
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "totalCost", label: "Total Cost", sortable: true, render: (value: string) => `$${value}` },
      { key: "laborCost", label: "Labor", sortable: true, render: (value: string) => `$${value}` },
      { key: "materialCost", label: "Materials", sortable: true, render: (value: string) => `$${value}` },
      { key: "status", label: "Status", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "validUntil", label: "Valid Until", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
      { key: "createdAt", label: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  invoices: {
    id: "invoices",
    title: "Invoices",
    description: "Payment and billing management",
    icon: Receipt,
    columns: [
      { key: "invoiceNumber", label: "Invoice #", sortable: true },
      { key: "total", label: "Total", sortable: true, render: (value: string) => `$${value}` },
      { key: "amountDue", label: "Amount Due", sortable: true, render: (value: string) => `$${value}` },
      { key: "status", label: "Status", sortable: true, render: (value: string) => <Badge variant={value === "paid" ? "default" : value === "overdue" ? "destructive" : "secondary"}>{value}</Badge> },
      { key: "dueDate", label: "Due Date", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
      { key: "createdAt", label: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  deals: {
    id: "deals",
    title: "Deals & Offers",
    description: "Merchant deal and promotion management",
    icon: Gift,
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "category", label: "Category", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "discountType", label: "Type", sortable: true },
      { key: "discountValue", label: "Value", sortable: true, render: (value: string) => `$${value}` },
      { key: "validFrom", label: "Valid From", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
      { key: "validUntil", label: "Valid Until", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
      { key: "isActive", label: "Status", sortable: true }
    ]
  },
  messages: {
    id: "messages",
    title: "Messages",
    description: "Platform communication system",
    icon: MessageSquare,
    columns: [
      { key: "subject", label: "Subject", sortable: true },
      { key: "senderName", label: "From", sortable: true },
      { key: "receiverName", label: "To", sortable: true },
      { key: "isRead", label: "Read", sortable: true, render: (value: boolean) => <Badge variant={value ? "default" : "secondary"}>{value ? "Read" : "Unread"}</Badge> },
      { key: "priority", label: "Priority", sortable: true, render: (value: string) => <Badge variant={value === "high" ? "destructive" : value === "medium" ? "default" : "secondary"}>{value}</Badge> },
      { key: "createdAt", label: "Sent", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() }
    ]
  },
  calendarEvents: {
    id: "calendarEvents",
    title: "Calendar Events",
    description: "Scheduling and event management",
    icon: Calendar,
    columns: [
      { key: "title", label: "Title", sortable: true },
      { key: "eventType", label: "Type", sortable: true, render: (value: string) => <Badge variant="outline">{value}</Badge> },
      { key: "startTime", label: "Start Time", sortable: true, render: (value: string) => new Date(value).toLocaleString() },
      { key: "location", label: "Location", sortable: true },
      { key: "reminderMinutes", label: "Reminder", sortable: true, render: (value: number) => `${value} min` },
      { key: "isRecurring", label: "Recurring", sortable: true, render: (value: boolean) => <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge> }
    ]
  }
};

export default function Admin() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("users");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  // Check if user is admin
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  const isAdmin = (currentUser as any)?.role === "admin";

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const currentConfig = entityConfigs[selectedEntity];

  const handleItemSelect = (itemId: string) => {
    setSelectedEntity(itemId as EntityType);
    setShowCreateModal(false);
    setEditingItem(null);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
  };

  const handleStatusChange = (item: any, newStatus: string) => {
    // Handle status change logic here
    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus}`,
    });
  };

  // Custom admin sidebar width
  const adminStyle = {
    "--sidebar-width": "20rem",       // 320px for admin sidebar
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <SidebarProvider style={adminStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AdminSidebar 
          selectedItem={selectedEntity}
          onItemSelect={handleItemSelect}
        />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Admin Header */}
          <header className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-admin-sidebar-toggle">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-3">
                <currentConfig.icon className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{currentConfig.title}</h1>
                  <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Admin Panel
              </Badge>
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            <div className="w-full">
              <AdminDataTable
                entityType={selectedEntity}
                title={currentConfig.title}
                description={currentConfig.description}
                columns={currentConfig.columns}
                actions={{
                  copy: true,
                  print: true,
                  download: true,
                  email: true,
                  changeStatus: true,
                  edit: true,
                  delete: true
                }}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Create Modal */}
      <AdminCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        entityType={selectedEntity}
        title={currentConfig.title}
      />
    </SidebarProvider>
  );
}