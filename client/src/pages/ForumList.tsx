import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'wouter';
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
  MessageCircle, 
  Plus, 
  Search,
  Users,
  TrendingUp,
  HelpCircle,
  Megaphone,
  Image as ImageIcon,
  Lock,
  Globe,
  Star,
  Clock,
  Activity,
  Loader2,
  RefreshCw,
  FileText,
  Shield,
  Eye,
  ChevronRight,
  Pin
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Types based on API response structures
interface Forum {
  id: string;
  name: string;
  description: string;
  forumType: 'general' | 'qa' | 'announcements' | 'help' | 'showcase' | 'group';
  moderationLevel: 'open' | 'moderated' | 'restricted' | 'locked';
  isActive: boolean;
  isPrivate: boolean;
  communityGroupId?: string;
  iconUrl?: string;
  bannerUrl?: string;
  rules?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API
  topicCount?: number;
  postCount?: number;
  participantCount?: number;
  lastActivity?: {
    topicId: string;
    topicTitle: string;
    authorName: string;
    createdAt: string;
  };
  userRole?: 'owner' | 'moderator' | 'member' | null;
  canPost?: boolean;
  canModerate?: boolean;
}

const forumTypeConfig = {
  general: {
    icon: MessageCircle,
    label: 'General Discussion',
    description: 'Open discussions about various topics',
    color: 'text-blue-600'
  },
  qa: {
    icon: HelpCircle,
    label: 'Q&A',
    description: 'Questions and answers with voting',
    color: 'text-green-600'
  },
  announcements: {
    icon: Megaphone,
    label: 'Announcements',
    description: 'Important announcements and updates',
    color: 'text-orange-600'
  },
  help: {
    icon: Shield,
    label: 'Help & Support',
    description: 'Get help with technical issues',
    color: 'text-purple-600'
  },
  showcase: {
    icon: ImageIcon,
    label: 'Showcase',
    description: 'Share your projects and achievements',
    color: 'text-pink-600'
  },
  group: {
    icon: Users,
    label: 'Group Forum',
    description: 'Private forum for group members',
    color: 'text-gray-600'
  }
};

// Create Forum Schema - simplified for basic forum creation
const createForumSchema = {
  name: '',
  description: '',
  forumType: 'general' as const,
  isPrivate: false,
  tags: [] as string[],
  rules: ''
};

type CreateForumData = typeof createForumSchema;

export default function ForumList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('activity');
  const [isCreateForumOpen, setIsCreateForumOpen] = useState(false);

  // Create Forum Form
  const forumForm = useForm<CreateForumData>({
    resolver: zodResolver,
    defaultValues: createForumSchema
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch forums from API
  const {
    data: forums = [],
    isLoading,
    error,
    refetch
  } = useQuery<Forum[]>({
    queryKey: ['/api/forums'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Get current user for permissions
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user']
  });

  // Forum creation mutation
  const createForumMutation = useMutation({
    mutationFn: async (forumData: CreateForumData) => {
      return apiRequest('POST', '/api/forums', forumData);
    },
    onSuccess: () => {
      toast({
        title: "Forum created!",
        description: "Your forum has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forums'] });
      setIsCreateForumOpen(false);
      forumForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating forum",
        description: error.message || "Failed to create forum. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort forums
  const filteredAndSortedForums = useMemo(() => {
    if (!forums.length) return [];
    
    let filtered = forums.filter(forum => {
      // Only show active forums
      if (!forum.isActive) return false;
      
      const matchesSearch = searchQuery === '' ||
        forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesType = typeFilter === 'all' || forum.forumType === typeFilter;
      
      const matchesAccess = accessFilter === 'all' ||
        (accessFilter === 'public' && !forum.isPrivate) ||
        (accessFilter === 'private' && forum.isPrivate);
        
      return matchesSearch && matchesType && matchesAccess;
    });

    // Sort forums
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'topics':
          return (b.topicCount || 0) - (a.topicCount || 0);
        case 'posts':
          return (b.postCount || 0) - (a.postCount || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'activity':
        default:
          // Sort by last activity, then by post count
          if (a.lastActivity && b.lastActivity) {
            return new Date(b.lastActivity.createdAt).getTime() - new Date(a.lastActivity.createdAt).getTime();
          }
          if (a.lastActivity && !b.lastActivity) return -1;
          if (!a.lastActivity && b.lastActivity) return 1;
          return (b.postCount || 0) - (a.postCount || 0);
      }
    });

    return filtered;
  }, [forums, searchQuery, typeFilter, accessFilter, sortBy]);

  // Form submission handler
  const onCreateForum = async (data: CreateForumData) => {
    createForumMutation.mutate(data);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Community Forums</h1>
          <p className="text-muted-foreground">Loading forums...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-foreground">Community Forums</h1>
          <div className="text-destructive">
            <p>Error loading forums</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalTopics = forums.reduce((acc, forum) => acc + (forum.topicCount || 0), 0);
  const totalPosts = forums.reduce((acc, forum) => acc + (forum.postCount || 0), 0);
  const totalParticipants = forums.reduce((acc, forum) => acc + (forum.participantCount || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Community Forums</h1>
        <p className="text-muted-foreground">
          Connect, share knowledge, and discuss topics with the HomeHub community
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{forums.length}</p>
                <p className="text-sm text-muted-foreground">Forums</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalTopics}</p>
                <p className="text-sm text-muted-foreground">Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Forum Button - Only for admins */}
      {currentUser?.role === 'admin' && (
        <div className="flex justify-center">
          <Dialog open={isCreateForumOpen} onOpenChange={setIsCreateForumOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-forum">
                <Plus className="h-4 w-4 mr-2" />
                Create Forum
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Forum</DialogTitle>
                <DialogDescription>
                  Create a new forum for community discussions
                </DialogDescription>
              </DialogHeader>
              <Form {...forumForm}>
                <form onSubmit={forumForm.handleSubmit(onCreateForum)} className="space-y-4 py-4">
                  <FormField
                    control={forumForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forum Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter forum name"
                            data-testid="input-forum-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forumForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this forum is about..."
                            rows={3}
                            data-testid="textarea-forum-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forumForm.control}
                    name="forumType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forum Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-forum-type">
                              <SelectValue placeholder="Select forum type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(forumTypeConfig).map(([type, config]) => (
                              <SelectItem key={type} value={type}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={forumForm.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            data-testid="checkbox-private-forum"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Make this forum private
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateForumOpen(false)}
                  disabled={createForumMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={forumForm.handleSubmit(onCreateForum)}
                  disabled={createForumMutation.isPending}
                  data-testid="button-submit-forum"
                >
                  {createForumMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Forum
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-forums"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="Forum Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(forumTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={accessFilter} onValueChange={setAccessFilter}>
              <SelectTrigger data-testid="select-access-filter">
                <SelectValue placeholder="Access Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forums</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Recent Activity</SelectItem>
                <SelectItem value="topics">Most Topics</SelectItem>
                <SelectItem value="posts">Most Posts</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Forums Grid */}
      {filteredAndSortedForums.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== 'all' || accessFilter !== 'all'
                ? "No forums found matching your criteria."
                : "No forums available yet."}
            </p>
            {(searchQuery || typeFilter !== 'all' || accessFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setAccessFilter('all');
                }}
                className="mt-4"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedForums.map((forum) => {
            const TypeIcon = forumTypeConfig[forum.forumType]?.icon || MessageCircle;
            const typeConfig = forumTypeConfig[forum.forumType];
            
            return (
              <Link key={forum.id} href={`/forums/${forum.id}`}>
                <Card className="hover-elevate h-full" data-testid={`card-forum-${forum.id}`}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Forum Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {forum.iconUrl ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={forum.iconUrl} />
                              <AvatarFallback>
                                <TypeIcon className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${typeConfig?.color || 'text-blue-600'}`}>
                              <TypeIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg leading-tight">{forum.name}</h3>
                              {forum.isPrivate ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {typeConfig?.label || forum.forumType}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {forum.description}
                      </p>

                      {/* Tags */}
                      {forum.tags && forum.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {forum.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {forum.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{forum.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{forum.topicCount || 0} topics</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{forum.postCount || 0} posts</span>
                          </div>
                        </div>
                      </div>

                      {/* Last Activity */}
                      {forum.lastActivity && (
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Last activity:</span>
                          </div>
                          <p className="text-sm font-medium truncate mt-1">
                            {forum.lastActivity.topicTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {forum.lastActivity.authorName} • {formatDistanceToNow(new Date(forum.lastActivity.createdAt))} ago
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}