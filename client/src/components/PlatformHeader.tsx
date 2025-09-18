import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  ChevronDown, 
  MessageSquare, 
  Bell, 
  Calendar,
  User,
  Settings,
  LogOut,
  Home,
  CreditCard,
  Shield,
  Edit3,
  FileText
} from 'lucide-react';
import { Link } from 'wouter';
import { DevRoleSwitcher } from './DevRoleSwitcher';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'reminder' | 'platform';
}

interface Message {
  id: string;
  sender: string;
  preview: string;
  time: string;
  unread: boolean;
}

export function PlatformHeader() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Service Completed',
      message: 'Your HVAC maintenance has been completed',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      title: 'New Message',
      message: 'Contractor John Smith sent you a message',
      time: '5 hours ago',
      read: false
    },
    {
      id: '3',
      title: 'Payment Processed',
      message: 'Invoice #12345 payment has been processed',
      time: '1 day ago',
      read: true
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'John Smith',
      preview: 'Service completed successfully. Thank you!',
      time: '1 hour ago',
      unread: true
    },
    {
      id: '2',
      sender: 'Support Team',
      preview: 'Your HomeHERO membership has been renewed',
      time: '3 hours ago',
      unread: true
    },
    {
      id: '3',
      sender: 'Mike Johnson',
      preview: 'I can schedule your plumbing work for tomorrow',
      time: '1 day ago',
      unread: false
    }
  ]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'HVAC Inspection',
      time: 'Today at 2:00 PM',
      type: 'appointment'
    },
    {
      id: '2',
      title: 'Gutter Cleaning Reminder',
      time: 'Tomorrow at 9:00 AM',
      type: 'reminder'
    },
    {
      id: '3',
      title: 'HomeHub Monthly Webinar',
      time: 'Friday at 10:00 AM',
      type: 'platform'
    }
  ]);

  // Mock user data - in real app this would come from auth context
  const user = {
    nickname: 'HomeHero42',
    avatar: null, // null means no custom avatar uploaded
    membershipTier: 'HomeHERO'
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markMessageAsRead = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, unread: false } : msg
    ));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = messages.filter(m => m.unread).length;

  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="text-sm text-muted-foreground">
          HomeHub Platform
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Calendar Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-calendar">
              <Calendar className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Upcoming Events</h4>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" data-testid="link-manage-calendar">
                    Manage in Calendar
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.time}</div>
                    </div>
                    <Badge 
                      variant={event.type === 'appointment' ? 'default' : 
                              event.type === 'reminder' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Notifications Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-red-500">
                  {unreadNotificationCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Notifications</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllNotificationsAsRead}
                  data-testid="button-mark-all-read"
                >
                  Mark All Read
                </Button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-md border ${notification.read ? 'bg-background' : 'bg-accent'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{notification.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markNotificationAsRead(notification.id)}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteNotification(notification.id)}
                          data-testid={`button-delete-${notification.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Messages Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="button-messages">
              <MessageSquare className="h-4 w-4" />
              {unreadMessageCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-blue-500">
                  {unreadMessageCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Messages</h4>
                <Link href="/messages">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-messages">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-3 rounded-md border cursor-pointer ${message.unread ? 'bg-accent' : 'bg-background'}`}
                    onClick={() => markMessageAsRead(message.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{message.sender}</div>
                        <div className="text-xs text-muted-foreground mt-1">{message.preview}</div>
                        <div className="text-xs text-muted-foreground mt-1">{message.time}</div>
                      </div>
                      {message.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Dev-only Role Switcher */}
        <DevRoleSwitcher />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-2" data-testid="button-user-menu">
              <div className="w-8 h-8 bg-amber-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.nickname} className="w-full h-full rounded-md object-cover" />
                  ) : (
                    user.nickname.charAt(0).toUpperCase()
                  )}
                </span>
              </div>
              <span className="text-sm font-medium" data-testid="text-user-nickname">{user.nickname}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Member Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span data-testid="link-profile">Edit Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/home-details">
                <Home className="mr-2 h-4 w-4" />
                <span data-testid="link-home-details">Home Details</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/preferences">
                <Settings className="mr-2 h-4 w-4" />
                <span data-testid="link-preferences">Preferences</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/membership">
                <Shield className="mr-2 h-4 w-4" />
                <span data-testid="link-membership">Membership</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                <span data-testid="link-billing">Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/invoices">
                <FileText className="mr-2 h-4 w-4" />
                <span data-testid="link-invoices">Invoices</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}