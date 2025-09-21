import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Wrench,
  Shield,
  ClipboardCheck,
  Users,
  FileText,
  Building2,
  Percent,
  Gift,
  Users2,
  Activity,
  UsersRound,
  ChevronRight,
  ChevronDown,
  Settings,
  ShieldCheck,
  Award,
  Star,
  Trophy,
  MessageCircle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const navigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Repairs', url: '/repairs', icon: Wrench, subtitle: 'FixiT!' },
  { title: 'Maintenance', url: '/maintenance', icon: Shield, subtitle: 'PreventiT!' },
  { title: 'Inspections', url: '/inspections', icon: ClipboardCheck, subtitle: 'CheckiT!' },
  { 
    title: 'Contractors', 
    url: '/contractors', 
    icon: Users,
    subtitle: 'HandleiT!',
    submenu: [
      { title: 'Estimates', url: '/estimates', icon: FileText }
    ]
  },
  { title: 'Merchants', url: '/merchants', icon: Building2 },
  { title: 'Savvy Saver', url: '/savvy-saver', icon: Percent },
  { 
    title: 'Rewards', 
    url: '/rewards', 
    icon: Gift, 
    subtitle: 'LoyalizeiT!',
    submenu: [
      { title: 'Badges', url: '/badges', icon: Award },
      { title: 'Ranks', url: '/ranks', icon: Star },
      { title: 'Achievements', url: '/achievements', icon: Trophy }
    ]
  },
  { 
    title: 'Community', 
    url: '/community', 
    icon: Users2,
    subtitle: 'CommuniT!',
    submenu: [
      { title: 'Timeline', url: '/timeline', icon: Activity },
      { title: 'Groups', url: '/groups', icon: UsersRound }
    ]
  },
  { title: 'Forums', url: '/forums', icon: MessageCircle, subtitle: 'DiscussiT!' },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  // Check if user is admin to show admin section
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  const authUser = (currentUser as any)?.user ?? currentUser;
  const isAdmin = authUser?.role === "admin";

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(subitem => location === subitem.url);
  };

  const handleNavigation = (url: string) => {
    console.log(`Navigating to ${url}`);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2" data-testid="sidebar-header">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">H</span>
          </div>
          <div>
            <div className="font-semibold text-sidebar-foreground text-sm">HomeHub</div>
            <div className="text-xs text-muted-foreground">Premium Platform</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location === item.url;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isExpanded = expandedMenus.includes(item.title);
                const submenuActive = hasSubmenu ? isSubmenuActive(item.submenu) : false;
                
                return (
                  <div key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive || submenuActive}
                        data-testid={`nav-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <a 
                          href={item.url}
                          onClick={(e) => {
                            if (hasSubmenu && item.title !== 'Contractors' && item.title !== 'Rewards') {
                              e.preventDefault();
                              toggleMenu(item.title);
                            } else {
                              handleNavigation(item.url);
                              if (hasSubmenu) {
                                // For Contractors and Rewards, also toggle submenu after navigation
                                setTimeout(() => toggleMenu(item.title), 100);
                              }
                            }
                          }}
                          className="flex items-center gap-3 w-full"
                        >
                          <item.icon className="h-4 w-4" />
                          <div className="flex-1">
                            <span>{item.title}</span>
                            {item.subtitle && (
                              <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                            )}
                          </div>
                          {hasSubmenu && (
                            <div className="ml-auto">
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {hasSubmenu && isExpanded && (
                      <div className="ml-6 border-l border-sidebar-border pl-3 space-y-1">
                        {item.submenu.map((subitem) => {
                          const isSubActive = location === subitem.url;
                          return (
                            <SidebarMenuItem key={subitem.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={isSubActive}
                                size="sm"
                                data-testid={`nav-sub-${subitem.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                              >
                                <a 
                                  href={subitem.url}
                                  onClick={() => handleNavigation(subitem.url)}
                                  className="flex items-center gap-3"
                                >
                                  <subitem.icon className="h-3 w-3" />
                                  <span>{subitem.title}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Admin Section - Only visible to admin users */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === '/admin'}
                    data-testid="nav-go-to-admin"
                  >
                    <a 
                      href="/admin"
                      onClick={() => handleNavigation('/admin')}
                      className="flex items-center gap-3 w-full"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <div className="flex-1">
                        <span>Go to Admin</span>
                        <div className="text-xs text-muted-foreground">Platform Management</div>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3" data-testid="user-profile">
          <div className="h-8 w-8 bg-amber-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">H</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-sidebar-foreground">HomeHERO</span>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs px-1.5 py-0.5">
                Premium Member
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Points
              <span className="ml-2 font-medium text-amber-500">2,847</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
