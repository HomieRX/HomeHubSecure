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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertCommunityGroupSchema, insertCommunityPostSchema, type InsertCommunityGroup, type InsertCommunityPost } from '@shared/schema';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users2, 
  Plus, 
  Activity,
  UsersRound,
  MessageSquare,
  Heart,
  Share2,
  Star,
  Award,
  TrendingUp,
  Clock,
  MapPin,
  Image,
  Search,
  Globe,
  Lock,
  Loader2,
  RefreshCw,
  Shield,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

// Types based on API response structures
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
  isJoined?: boolean;
  recentActivity?: number;
}

interface TimelinePost {
  id: string;
  authorId: string;
  content: string;
  images?: string[];
  tags?: string[];
  likeCount: number;
  commentCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorAvatar?: string;
}

export default function Community() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Create Post Form
  const postForm = useForm<InsertCommunityPost>({
    resolver: zodResolver(insertCommunityPostSchema),
    defaultValues: {
      content: '',
      tags: [],
      images: [],
      isPublic: true,
      authorId: '', // Will be set from user context
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form submission handlers
  const onCreateGroup = async (data: InsertCommunityGroup) => {
    // TODO: Get actual user ID from context/auth
    const groupData = {
      ...data,
      createdBy: 'temp-user-id', // Replace with actual user ID
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    createGroupMutation.mutate(groupData);
  };

  const onCreatePost = async (data: InsertCommunityPost) => {
    // TODO: Get actual user ID from context/auth
    const postData = {
      ...data,
      authorId: 'temp-user-id', // Replace with actual user ID
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    createPostMutation.mutate(postData);
  };

  // Fetch community groups
  const {
    data: communityGroups = [],
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useQuery<CommunityGroup[]>({
    queryKey: ['/api/community/groups'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Fetch timeline posts
  const {
    data: timelinePosts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery<TimelinePost[]>({
    queryKey: ['/api/community/posts'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3
  });

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

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertCommunityPost) => {
      return apiRequest('POST', '/api/community/posts', postData);
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setIsCreatePostOpen(false);
      postForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like post mutation with optimistic updates
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      const action = isLiked ? 'unlike' : 'like';
      return apiRequest('POST', `/api/community/posts/${postId}/${action}`);
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/community/posts'] });
      const previousPosts = queryClient.getQueryData<TimelinePost[]>(['/api/community/posts']);
      
      if (previousPosts) {
        const updatedPosts = previousPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1
              }
            : post
        );
        queryClient.setQueryData(['/api/community/posts'], updatedPosts);
      }
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['/api/community/posts'], context.previousPosts);
      }
      toast({
        title: "Error updating like",
        description: "Failed to update post like. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  // Join/Leave group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async ({ groupId, action }: { groupId: string; action: 'join' | 'leave' }) => {
      return apiRequest('POST', `/api/community/groups/${groupId}/${action}`);
    },
    onMutate: async ({ groupId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/community/groups'] });
      const previousGroups = queryClient.getQueryData<CommunityGroup[]>(['/api/community/groups']);
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/community/groups'] });
    },
  });

  // Filter data based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return communityGroups.slice(0, 6); // Show top 6
    return communityGroups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [communityGroups, searchQuery]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return timelinePosts.slice(0, 5); // Show top 5
    return timelinePosts.filter(post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 5);
  }, [timelinePosts, searchQuery]);


  // Handle like toggle
  const handleToggleLike = (postId: string, isLiked: boolean) => {
    likePostMutation.mutate({ postId, isLiked });
  };

  // Handle join/leave group
  const handleJoinLeave = (groupId: string, isJoined: boolean) => {
    const action = isJoined ? 'leave' : 'join';
    joinGroupMutation.mutate({ groupId, action });
  };

  const isLoading = groupsLoading || postsLoading;
  const hasError = groupsError || postsError;

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
          <p className="text-muted-foreground">Loading community...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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
  if (hasError) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
          <div className="text-destructive">
            <p>Error loading community data</p>
            <Button 
              onClick={() => {
                refetchGroups();
                refetchPosts();
              }} 
              className="mt-2"
            >
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
        <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
        <p className="text-muted-foreground">
          Connect with neighbors, share knowledge, and build relationships
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <UsersRound className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{communityGroups.length}</p>
                <p className="text-sm text-muted-foreground">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{timelinePosts.length}</p>
                <p className="text-sm text-muted-foreground">Recent Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
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
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {timelinePosts.reduce((acc, post) => acc + post.likeCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Community Group</DialogTitle>
              <DialogDescription>
                Start a new group to connect with like-minded neighbors
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

        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-create-post">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share with Community</DialogTitle>
              <DialogDescription>
                Share something with the HomeHub community
              </DialogDescription>
            </DialogHeader>
            <Form {...postForm}>
              <form onSubmit={postForm.handleSubmit(onCreatePost)} className="space-y-4 py-4">
                <FormField
                  control={postForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's on your mind?"
                          rows={4}
                          data-testid="textarea-post-content"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={postForm.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-public-post"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Make this post public
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreatePostOpen(false)}
                disabled={createPostMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={postForm.handleSubmit(onCreatePost)}
                disabled={createPostMutation.isPending}
                data-testid="button-submit-post"
              >
                {createPostMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups and posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-community"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="timeline">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5" />
                  Featured Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredGroups.slice(0, 3).map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{group.name}</h4>
                        {group.isPrivate ? (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {group.memberCount} members
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {group.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={group.isJoined ? "outline" : "default"}
                      onClick={() => handleJoinLeave(group.id, group.isJoined || false)}
                    >
                      {group.isJoined ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                        <AvatarFallback className="text-xs">
                          {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{post.authorName || 'Anonymous'}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.createdAt), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => handleToggleLike(post.id, false)}
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        {post.likeCount}
                      </Button>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.commentCount}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{group.name}</h3>
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
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.memberCount}
                      </span>
                      {group.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {group.location}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={group.isJoined ? "outline" : "default"}
                      onClick={() => handleJoinLeave(group.id, group.isJoined || false)}
                      className="w-full"
                    >
                      {group.isJoined ? 'Joined' : 'Join Group'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                        <AvatarFallback>
                          {post.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{post.authorName || 'Anonymous'}</p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post.id, false)}
                        disabled={likePostMutation.isPending}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {post.likeCount}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.commentCount}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}