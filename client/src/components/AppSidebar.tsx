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
  Home,
  BarChart3,
  Store,
  ClipboardList,
  FileText,
  Users,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { useLocation } from 'wouter';

const navigationItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  { title: 'Store', url: '/store', icon: Store },
  { title: 'Service Requests', url: '/service-requests', icon: ClipboardList },
  { title: 'Invoices', url: '/invoices', icon: FileText },
  { title: 'Contractors', url: '/contractors', icon: Users },
  { title: 'Savvy Saver', url: '/savvy-saver', icon: Tag },
  { title: 'CheckIT!', url: '/checkit', icon: CheckCircle },
];

export function AppSidebar() {
  const [location] = useLocation();

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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={() => handleNavigation(item.url)}
                      data-testid={`nav-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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