import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Shield,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

type AdminMenuItem = {
  id: string;
  title: string;
  icon: any;
  description?: string;
  count?: number;
};

const adminMenuItems: AdminMenuItem[] = [
  {
    id: "users",
    title: "Users",
    icon: Users,
    description: "Manage platform users and roles"
  },
  {
    id: "memberProfiles",
    title: "Member Profiles", 
    icon: UserPlus,
    description: "Homeowner profiles and membership tiers"
  },
  {
    id: "contractorProfiles",
    title: "Contractor Profiles",
    icon: Wrench,
    description: "Contractor verification and management"
  },
  {
    id: "merchantProfiles",
    title: "Merchant Profiles",
    icon: Building2,
    description: "Business partner management"
  },
  {
    id: "serviceRequests",
    title: "Service Requests",
    icon: Settings,
    description: "Platform service request management"
  },
  {
    id: "workOrders",
    title: "Work Orders",
    icon: FileText,
    description: "Active work order tracking"
  },
  {
    id: "estimates",
    title: "Estimates",
    icon: DollarSign,
    description: "Contractor estimate management"
  },
  {
    id: "invoices",
    title: "Invoices",
    icon: Receipt,
    description: "Payment and billing management"
  },
  {
    id: "deals",
    title: "Deals & Offers",
    icon: Gift,
    description: "Merchant deal management"
  },
  {
    id: "messages",
    title: "Messages",
    icon: MessageSquare,
    description: "Platform communication system"
  },
  {
    id: "calendarEvents",
    title: "Calendar Events",
    icon: Calendar,
    description: "Scheduling and event management"
  }
];

interface AdminSidebarProps {
  selectedItem: string;
  onItemSelect: (itemId: string) => void;
}

export function AdminSidebar({ selectedItem, onItemSelect }: AdminSidebarProps) {
  const [location] = useLocation();
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  // Get counts for each item type
  const { data: itemCounts = {} } = useQuery({
    queryKey: ["/api/admin/counts"],
    select: (data: any) => data || {}
  });

  const handleItemClick = (itemId: string) => {
    onItemSelect(itemId);
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">HomeHub Admin</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = selectedItem === item.id;
                const count = itemCounts[item.id];
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleItemClick(item.id)}
                      isActive={isActive}
                      className="w-full justify-start gap-3 px-3 py-2 hover-elevate transition-all duration-200"
                      data-testid={`admin-nav-${item.id}`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {count !== undefined && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {count}
                          </Badge>
                        )}
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 space-y-4">
        {/* Back to Platform Button */}
        <Link href="/" className="w-full">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 hover-elevate"
            data-testid="button-back-to-platform"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Platform
          </Button>
        </Link>

        {/* User Information */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={(currentUser as any)?.profileImageUrl} 
              alt={(currentUser as any)?.firstName + " " + (currentUser as any)?.lastName}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {(currentUser as any)?.firstName?.[0]}{(currentUser as any)?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {(currentUser as any)?.firstName} {(currentUser as any)?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {(currentUser as any)?.email}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Admin
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}