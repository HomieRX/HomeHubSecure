import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  UsersRound, 
  Plus, 
  Search,
  Activity,
  Users,
  MapPin,
  Star,
  Settings,
  Lock,
  Globe,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  isJoined: boolean;
  recentActivity: number;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
  moderators: string[];
  location?: string;
  lastActivityAt: Date;
  role?: 'admin' | 'moderator' | 'member';
}

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('activity');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>([
    {
      id: '1',
      name: 'DIY Home Projects',
      description: 'Share your DIY home improvement projects, get advice, and inspire others! From simple repairs to major renovations, this is your space to connect with fellow DIY enthusiasts.',
      category: 'DIY & Projects',
      memberCount: 1247,
      isPrivate: false,
      isJoined: true,
      recentActivity: 23,
      tags: ['DIY', 'Home Improvement', 'Projects', 'Tips'],
      createdAt: new Date(2024, 1, 15),
      moderators: ['Sarah DIY Queen', 'Mike Builder'],
      location: 'Austin Area',
      lastActivityAt: new Date(2025, 8, 13, 15, 30),
      role: 'moderator'
    },
    {
      id: '2',
      name: 'Garden Enthusiasts',
      description: 'Connect with fellow gardening enthusiasts, share plant photos, exchange growing tips, and discuss everything related to creating beautiful outdoor spaces.',
      category: 'Gardening',
      memberCount: 856,
      isPrivate: false,
      isJoined: true,
      recentActivity: 45,
      tags: ['Gardening', 'Plants', 'Landscaping', 'Organic'],
      createdAt: new Date(2024, 2, 3),
      moderators: ['Green Thumb Gary'],
      location: 'Central Texas',
      lastActivityAt: new Date(2025, 8, 13, 12, 15),
      role: 'member'
    },
    {
      id: '3',
      name: 'Smart Home Tech',
      description: 'Discuss the latest smart home technology, share automation tips, review products, and help others navigate the world of connected homes.',
      category: 'Technology',
      memberCount: 634,
      isPrivate: false,
      isJoined: false,
      recentActivity: 12,
      tags: ['Smart Home', 'Technology', 'Automation', 'Reviews'],
      createdAt: new Date(2024, 3, 10),
      moderators: ['Tech Tom', 'Smart Sally'],
      lastActivityAt: new Date(2025, 8, 12, 18, 45)
    },
    {
      id: '4',
      name: 'Neighborhood Watch - Cedar Park',
      description: 'Private group for Cedar Park residents to discuss community safety, share local updates, and coordinate neighborhood initiatives.',
      category: 'Safety & Security',
      memberCount: 234,
      isPrivate: true,
      isJoined: false,
      recentActivity: 8,
      tags: ['Safety', 'Community', 'Cedar Park', 'Local'],
      createdAt: new Date(2024, 4, 1),
      moderators: ['Officer Johnson'],
      location: 'Cedar Park, TX',
      lastActivityAt: new Date(2025, 8, 11, 14, 20)
    },
    {
      id: '5',
      name: 'Energy Efficient Homes',
      description: 'Share tips and tricks for making your home more energy efficient and environmentally friendly. Discuss solar, insulation, and green living.',
      category: 'Sustainability',
      memberCount: 423,
      isPrivate: false,
      isJoined: true,
      recentActivity: 18,
      tags: ['Energy Efficiency', 'Sustainability', 'Solar', 'Green Living'],
      createdAt: new Date(2024, 0, 20),
      moderators: ['Eco Emma'],
      lastActivityAt: new Date(2025, 8, 12, 9, 30),
      role: 'member'
    },
    {
      id: '6',
      name: 'Home Security Solutions',
      description: 'Discuss home security systems, share experiences with different providers, and get advice on protecting your property.',
      category: 'Safety & Security',
      memberCount: 312,
      isPrivate: false,
      isJoined: false,
      recentActivity: 6,
      tags: ['Security', 'Cameras', 'Alarms', 'Safety'],
      createdAt: new Date(2024, 5, 12),
      moderators: ['Security Steve'],
      lastActivityAt: new Date(2025, 8, 10, 16, 45)
    },
    {
      id: '7',
      name: 'Austin Home Owners',
      description: 'Local group for Austin homeowners to share recommendations, discuss property values, and connect with neighbors.',
      category: 'Local Community',
      memberCount: 892,
      isPrivate: false,
      isJoined: true,
      recentActivity: 31,
      tags: ['Austin', 'Homeowners', 'Local', 'Property'],
      createdAt: new Date(2023, 11, 5),
      moderators: ['Austin Amy', 'Local Larry'],
      location: 'Austin, TX',
      lastActivityAt: new Date(2025, 8, 13, 11, 20),
      role: 'member'
    }
  ]);

  const categories = ['All', 'DIY & Projects', 'Gardening', 'Technology', 'Safety & Security', 'Sustainability', 'Local Community'];
  const membershipStatuses = ['All', 'Joined', 'Not Joined', 'Private'];
  const sortOptions = ['Recent Activity', 'Most Members', 'Newest', 'Alphabetical'];

  const filterAndSortGroups = () => {
    let filtered = communityGroups.filter(group => {
      const matchesSearch = searchQuery === '' || 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesCategory = categoryFilter === 'all' || group.category === categoryFilter;
      
      const matchesMembership = membershipFilter === 'all' ||
        (membershipFilter === 'joined' && group.isJoined) ||
        (membershipFilter === 'not joined' && !group.isJoined) ||
        (membershipFilter === 'private' && group.isPrivate);
        
      return matchesSearch && matchesCategory && matchesMembership;
    });

    // Sort groups
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent activity':
          return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
        case 'most members':
          return b.memberCount - a.memberCount;
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return b.recentActivity - a.recentActivity;
      }
    });

    return filtered;
  };

  const filteredGroups = filterAndSortGroups();
  const joinedGroups = communityGroups.filter(group => group.isJoined);
  const popularGroups = communityGroups
    .filter(group => !group.isJoined && !group.isPrivate)
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5);

  const joinGroup = (groupId: string) => {
    setCommunityGroups(groups => 
      groups.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: true, memberCount: group.memberCount + 1, role: 'member' }
          : group
      )
    );
  };

  const leaveGroup = (groupId: string) => {
    setCommunityGroups(groups => 
      groups.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: false, memberCount: group.memberCount - 1, role: undefined }
          : group
      )
    );
  };

  const stats = {
    totalGroups: communityGroups.length,
    joinedGroups: joinedGroups.length,
    totalMembers: joinedGroups.reduce((sum, group) => sum + group.memberCount, 0),
    moderatedGroups: joinedGroups.filter(group => group.role === 'moderator' || group.role === 'admin').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <UsersRound className="h-6 w-6" />
            Community Groups
          </h1>
          <p className="text-muted-foreground">Discover and join groups that match your interests</p>
        </div>
        
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Start a new community group around shared interests or location.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input placeholder="e.g., Austin Pool Maintenance" data-testid="input-group-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select>
                  <SelectTrigger data-testid="select-group-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat !== 'All').map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="button-submit-group">Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Groups</p>
                <p className="text-2xl font-semibold">{stats.totalGroups}</p>
              </div>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Joined Groups</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.joinedGroups}</p>
              </div>
              <Star className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-semibold text-green-600">{stats.totalMembers.toLocaleString()}</p>
              </div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moderated</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.moderatedGroups}</p>
              </div>
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-groups">All Groups</TabsTrigger>
          <TabsTrigger value="joined" data-testid="tab-my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover" data-testid="tab-discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-groups"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                  <SelectTrigger data-testid="select-membership-filter">
                    <SelectValue placeholder="Membership" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipStatuses.map((status) => (
                      <SelectItem key={status} value={status.toLowerCase()}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort-by">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{group.name}</h3>
                          {group.isPrivate ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{group.category}</p>
                        {group.role && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {group.role}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">{group.memberCount}</p>
                        <p className="text-xs text-muted-foreground">members</p>
                      </div>
                    </div>
                    
                    <p className="text-sm line-clamp-3">{group.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{group.recentActivity} recent</span>
                      </div>
                      {group.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{group.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(group.lastActivityAt, 'MMM d')}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {group.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {group.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{group.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {group.isJoined ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${group.id}`}>
                            View Group
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => leaveGroup(group.id)}
                            data-testid={`button-leave-${group.id}`}
                          >
                            Leave
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => joinGroup(group.id)}
                          data-testid={`button-join-${group.id}`}
                        >
                          {group.isPrivate ? 'Request to Join' : 'Join Group'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="joined" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedGroups.map((group) => (
              <Card key={group.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.category}</p>
                        {group.role && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                            {group.role}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{group.memberCount}</p>
                        <p className="text-xs text-muted-foreground">members</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{group.recentActivity} new posts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Active</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" data-testid={`button-open-${group.id}`}>
                        Open Group
                      </Button>
                      {group.role === 'moderator' && (
                        <Button size="sm" variant="outline" data-testid={`button-manage-${group.id}`}>
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularGroups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {group.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.category}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {group.memberCount} members
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {group.recentActivity} recent posts
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => joinGroup(group.id)}
                      data-testid={`button-join-popular-${group.id}`}
                    >
                      Join Group
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'all' || membershipFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Be the first to create a community group!'}
            </p>
            <Button onClick={() => setIsCreateGroupOpen(true)} data-testid="button-create-first-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}