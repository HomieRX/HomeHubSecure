import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertCommunityGroupSchema, type InsertCommunityGroup } from '@shared/schema';
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
  MessageSquare,
  Loader2,
  RefreshCw,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

// Type based on the API response structure
interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  coverImage?: string;
  memberCount: number;
  tags?: string[];
  location?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Additional computed fields
  role?: 'admin' | 'moderator' | 'member';
  isJoined?: boolean;
  recentActivity?: number;
}


export default function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('activity');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Create Group Form
  const groupForm = useForm<InsertCommunityGroup>({
    resolver: zodResolver(insertCommunityGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      isPrivate: false,
      tags: [],
      location: '',
      createdBy: '', // Will be set from user context
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch community groups from API
  const {
    data: communityGroups = [],
    isLoading,
    error,
    refetch
  } = useQuery<CommunityGroup[]>({
    queryKey: ['/api/community/groups'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Form submission handler
  const onCreateGroup = async (data: InsertCommunityGroup) => {
    // TODO: Get actual user ID from context/auth
    const groupData = {
      ...data,
      createdBy: 'temp-user-id', // Replace with actual user ID
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    createGroupMutation.mutate(groupData);
  };

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: InsertCommunityGroup) => {
      return apiRequest('POST', '/api/community/groups', groupData);
    },
    onSuccess: () => {
      toast({
        title: "Group created!",
        description: "Your community group has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/community/groups'] });
      setIsCreateGroupOpen(false);
      groupForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating group",
        description: error.message || "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join/Leave group mutation with optimistic updates
  const joinGroupMutation = useMutation({
    mutationFn: async ({ groupId, action }: { groupId: string; action: 'join' | 'leave' }) => {
      return apiRequest('POST', `/api/community/groups/${groupId}/${action}`);
    },
    onMutate: async ({ groupId, action }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['/api/community/groups'] });
      
      // Snapshot current value
      const previousGroups = queryClient.getQueryData<CommunityGroup[]>(['/api/community/groups']);
      
      // Optimistically update cache
      if (previousGroups) {
        const updatedGroups = previousGroups.map(group => 
          group.id === groupId 
            ? { 
                ...group, 
                memberCount: action === 'join' ? group.memberCount + 1 : group.memberCount - 1,
                isJoined: action === 'join'
              }
            : group
        );
        queryClient.setQueryData(['/api/community/groups'], updatedGroups);
      }
      
      return { previousGroups };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['/api/community/groups'], context.previousGroups);
      }
      toast({
        title: "Error updating membership",
        description: "Failed to update group membership. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, { action }) => {
      toast({
        title: action === 'join' ? "Joined group!" : "Left group",
        description: action === 'join' 
          ? "You've successfully joined the group." 
          : "You've left the group.",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/community/groups'] });
    },
  });

  // Compute filter options from real data
  const categories = useMemo(() => {
    const allCategories = communityGroups.map(g => g.category).filter(Boolean);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [communityGroups]);

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    if (!communityGroups.length) return [];
    
    let filtered = communityGroups.filter(group => {
      const matchesSearch = searchQuery === '' ||
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesCategory = categoryFilter === 'all' || 
        group.category === categoryFilter;
        
      const matchesMembership = membershipFilter === 'all' ||
        (membershipFilter === 'joined' && group.isJoined) ||
        (membershipFilter === 'not-joined' && !group.isJoined);
        
      return matchesSearch && matchesCategory && matchesMembership;
    });

    // Sort groups
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'members':
          return b.memberCount - a.memberCount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'activity':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [communityGroups, searchQuery, categoryFilter, membershipFilter, sortBy]);


  // Handle join/leave group
  const handleJoinLeave = (groupId: string, isJoined: boolean) => {
    const action = isJoined ? 'leave' : 'join';
    joinGroupMutation.mutate({ groupId, action });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Community Groups</h1>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Community Groups</h1>
          <div className="text-destructive">
            <p>Error loading groups: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const groupCategories = ['DIY & Projects', 'Gardening', 'Technology', 'Safety & Security', 'General'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Community Groups</h1>
        <p className="text-muted-foreground">
          Connect with like-minded homeowners and share knowledge
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <UsersRound className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{communityGroups.length}</p>
                <p className="text-sm text-muted-foreground">Total Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {communityGroups.reduce((acc, group) => acc + group.memberCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {communityGroups.filter(g => !g.isPrivate).length}
                </p>
                <p className="text-sm text-muted-foreground">Public Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {communityGroups.filter(g => g.isJoined).length}
                </p>
                <p className="text-sm text-muted-foreground">Your Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Group Button */}
      <div className="flex justify-center">
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Start a new community group around a shared interest
              </DialogDescription>
            </DialogHeader>
            <Form {...groupForm}>
              <form onSubmit={groupForm.handleSubmit(onCreateGroup)} className="space-y-4 py-4">
                <FormField
                  control={groupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter group name"
                          data-testid="input-group-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={groupForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what your group is about..."
                          rows={3}
                          data-testid="textarea-group-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={groupForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-group-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groupCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={groupForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Austin, TX"
                          data-testid="input-group-location"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={groupForm.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-private-group"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Make this group private
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateGroupOpen(false)}
                disabled={createGroupMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={groupForm.handleSubmit(onCreateGroup)}
                disabled={createGroupMutation.isPending}
                data-testid="button-submit-group"
              >
                {createGroupMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
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
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="joined">My Groups</SelectItem>
                <SelectItem value="not-joined">Available</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Recent Activity</SelectItem>
                <SelectItem value="members">Most Members</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      {filteredAndSortedGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== 'all' || membershipFilter !== 'all'
                ? "No groups found matching your criteria."
                : "No groups yet. Be the first to create one!"}
            </p>
            {(searchQuery || categoryFilter !== 'all' || membershipFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setMembershipFilter('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedGroups.map((group) => (
            <Card key={group.id} className="hover-elevate">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Group Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        {group.isPrivate ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {group.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {group.description}
                  </p>

                  {/* Tags */}
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {group.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {group.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{group.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{group.memberCount} members</span>
                    </div>
                    {group.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{group.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={group.isJoined ? "outline" : "default"}
                      onClick={() => handleJoinLeave(group.id, group.isJoined || false)}
                      disabled={joinGroupMutation.isPending}
                      data-testid={`button-join-${group.id}`}
                    >
                      {joinGroupMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      {group.isJoined ? 'Leave' : 'Join'}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}