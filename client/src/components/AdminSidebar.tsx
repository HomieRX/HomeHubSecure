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
  ArrowLeft,
  Award,
  Crown,
  Trophy,
  Cog,
  Hash,
  MessageCircle,
  MessageSquareText,
  Flag
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
  },
  {
    id: "badges",
    title: "Badges",
    icon: Award,
    description: "Manage gamification badges and rewards"
  },
  {
    id: "ranks",
    title: "Ranks",
    icon: Crown,
    description: "Manage user ranking system and levels"
  },
  {
    id: "achievements",
    title: "Achievements",
    icon: Trophy,
    description: "Manage achievement system and progress tracking"
  },
  {
    id: "maintenanceItems",
    title: "PreventiT! Maintenance Items",
    icon: Cog,
    description: "Manage maintenance catalog and task definitions"
  },
  {
    id: "forums",
    title: "Forums",
    icon: Hash,
    description: "Manage community forums and discussion boards"
  },
  {
    id: "forumTopics",
    title: "Forum Topics",
    icon: MessageCircle,
    description: "Manage forum topics and discussions"
  },
  {
    id: "forumPosts",
    title: "Forum Posts",
    icon: MessageSquareText,
    description: "Manage forum posts and content moderation"
  },
  {
    id: "forumPostVotes",
    title: "Post Votes",
    icon: Flag,
    description: "Manage forum post voting system and analytics"
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

  const authUser = (currentUser as any)?.user ?? currentUser;
  const userDisplayName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ').trim();
  const userInitials = userDisplayName
    ? userDisplayName.split(' ').filter(Boolean).map(part => part[0]!.toUpperCase()).join('').slice(0, 2)
    : (authUser?.email ?? 'HH').slice(0, 2).toUpperCase();

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
              src={authUser?.profileImageUrl ?? undefined} 
              alt={userDisplayName}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userDisplayName || 'Admin'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {authUser?.email}
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