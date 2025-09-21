import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  Pin,
  CheckCircle2,
  XCircle,
  Archive,
  Home,
  ArrowUp,
  MessageSquare,
  User,
  Calendar
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
  userRole?: 'owner' | 'moderator' | 'member' | null;
  canPost?: boolean;
  canModerate?: boolean;
}

interface ForumTopic {
  id: string;
  forumId: string;
  title: string;
  description?: string;
  slug: string;
  authorId: string;
  status: 'active' | 'locked' | 'pinned' | 'solved' | 'closed' | 'archived';
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  acceptedAnswerId?: string;
  viewCount: number;
  bountyPoints: number;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API
  postCount?: number;
  lastPost?: {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: string;
  };
  authorName?: string;
  authorAvatar?: string;
}

// Create Topic Schema
const createTopicFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().max(500, 'Description is too long').optional().default(''),
  initialPostContent: z.string().min(1, 'Please provide an initial post'),
  tags: z.array(z.string()).default([]),
  bountyPoints: z.number().min(0, 'Bounty points cannot be negative').default(0),
});

type CreateTopicData = z.infer<typeof createTopicFormSchema>;

const createTopicDefaultValues: CreateTopicData = {
  title: '',
  description: '',
  initialPostContent: '',
  tags: [],
  bountyPoints: 0,
};

const forumTypeConfig = {
  general: {
    icon: MessageCircle,
    label: 'General Discussion',
    color: 'text-blue-600'
  },
  qa: {
    icon: HelpCircle,
    label: 'Q&A',
    color: 'text-green-600'
  },
  announcements: {
    icon: Megaphone,
    label: 'Announcements',
    color: 'text-orange-600'
  },
  help: {
    icon: Shield,
    label: 'Help & Support',
    color: 'text-purple-600'
  },
  showcase: {
    icon: ImageIcon,
    label: 'Showcase',
    color: 'text-pink-600'
  },
  group: {
    icon: Users,
    label: 'Group Forum',
    color: 'text-gray-600'
  }
};

const topicStatusConfig = {
  active: { icon: MessageCircle, label: 'Active', color: 'text-blue-600' },
  locked: { icon: Lock, label: 'Locked', color: 'text-gray-600' },
  pinned: { icon: Pin, label: 'Pinned', color: 'text-yellow-600' },
  solved: { icon: CheckCircle2, label: 'Solved', color: 'text-green-600' },
  closed: { icon: XCircle, label: 'Closed', color: 'text-red-600' },
  archived: { icon: Archive, label: 'Archived', color: 'text-gray-500' }
};

export default function Forum() {
  const params = useParams<{ forumId: string }>();
  const forumId = params.forumId!;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const topicsPerPage = 20;

  // Create Topic Form
  const topicForm = useForm<CreateTopicData>({
    resolver: zodResolver(createTopicFormSchema),
    defaultValues: createTopicDefaultValues
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch forum details
  const {
    data: forum,
    isLoading: forumLoading,
    error: forumError
  } = useQuery<Forum>({
    queryKey: ['/api/forums', forumId],
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  // Fetch forum topics
  const {
    data: topicsData,
    isLoading: topicsLoading,
    error: topicsError,
    refetch: refetchTopics
  } = useQuery<{ topics: ForumTopic[]; totalCount: number }>({
    queryKey: ['/api/forums', forumId, 'topics', {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: currentPage,
      limit: topicsPerPage,
      sort: sortBy,
      search: searchQuery || undefined
    }],
    staleTime: 2 * 60 * 1000,
    retry: 3,
    enabled: !!forumId
  });

  // Get current user for permissions
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user']
  });

  // Topic creation mutation
  const createTopicMutation = useMutation({
    mutationFn: async (topicData: CreateTopicData) => {
      return apiRequest('POST', `/api/forums/${forumId}/topics`, {
        ...topicData,
        forumId
      });
    },
    onSuccess: () => {
      toast({
        title: "Topic created!",
        description: "Your topic has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forums', forumId, 'topics'] });
      setIsCreateTopicOpen(false);
      topicForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating topic",
        description: error.message || "Failed to create topic. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    if (!topicsData?.topics) return [];
    
    let filtered = topicsData.topics;
    
    // Separate pinned topics
    const pinnedTopics = filtered.filter(topic => topic.isPinned && topic.status === 'active');
    const regularTopics = filtered.filter(topic => !topic.isPinned || topic.status !== 'active');
    
    // Sort regular topics (pinned topics stay in order)
    regularTopics.sort((a, b) => {
      switch (sortBy) {
        case 'replies':
          return (b.postCount || 0) - (a.postCount || 0);
        case 'views':
          return b.viewCount - a.viewCount;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'latest':
        default:
          // Sort by last post time if available, otherwise by creation time
          const aTime = a.lastPost ? new Date(a.lastPost.createdAt) : new Date(a.createdAt);
          const bTime = b.lastPost ? new Date(b.lastPost.createdAt) : new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
      }
    });

    return [...pinnedTopics, ...regularTopics];
  }, [topicsData?.topics, sortBy]);

  // Form submission handler
  const onCreateTopic = async (data: CreateTopicData) => {
    createTopicMutation.mutate(data);
  };

  // Handle loading state
  if (forumLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (forumError || !forum) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Forum Not Found</h1>
          <div className="text-destructive">
            <p>Unable to load forum details</p>
            <Link href="/forums">
              <Button className="mt-2">
                <Home className="h-4 w-4 mr-2" />
                Back to Forums
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const TypeIcon = forumTypeConfig[forum.forumType]?.icon || MessageCircle;
  const typeConfig = forumTypeConfig[forum.forumType];
  const canCreateTopics = forum.canPost && forum.moderationLevel !== 'locked' && forum.moderationLevel !== 'restricted';

  // Calculate pagination
  const totalPages = Math.ceil((topicsData?.totalCount || 0) / topicsPerPage);

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/forums" data-testid="breadcrumb-forums">Forums</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{forum.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Forum Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {forum.iconUrl ? (
              <Avatar className="w-16 h-16">
                <AvatarImage src={forum.iconUrl} />
                <AvatarFallback>
                  <TypeIcon className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`w-16 h-16 rounded-full bg-muted flex items-center justify-center ${typeConfig?.color || 'text-blue-600'}`}>
                <TypeIcon className="w-8 h-8" />
              </div>
            )}
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">{forum.name}</h1>
                    {forum.isPrivate ? (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Globe className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">
                      {typeConfig?.label || forum.forumType}
                    </Badge>
                    <Badge variant={forum.moderationLevel === 'locked' ? 'destructive' : 'secondary'}>
                      {forum.moderationLevel}
                    </Badge>
                  </div>
                </div>
                
                {canCreateTopics && (
                  <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-topic">
                        <Plus className="h-4 w-4 mr-2" />
                        New Topic
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Topic</DialogTitle>
                        <DialogDescription>
                          Start a new discussion in {forum.name}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...topicForm}>
                        <form onSubmit={topicForm.handleSubmit(onCreateTopic)} className="space-y-4 py-4">
                          <FormField
                            control={topicForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Topic Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter topic title"
                                    data-testid="input-topic-title"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={topicForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Brief description of the topic"
                                    data-testid="input-topic-description"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={topicForm.control}
                            name="initialPostContent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Initial Post</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Write your initial post content..."
                                    rows={6}
                                    data-testid="textarea-initial-post"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {forum.forumType === 'qa' && (
                            <FormField
                              control={topicForm.control}
                              name="bountyPoints"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bounty Points (optional)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="1000"
                                      placeholder="0"
                                      data-testid="input-bounty-points"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Reward points for the best answer (Q&A forums only)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </form>
                      </Form>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateTopicOpen(false)}
                          disabled={createTopicMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={topicForm.handleSubmit(onCreateTopic)}
                          disabled={createTopicMutation.isPending}
                          data-testid="button-submit-topic"
                        >
                          {createTopicMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Create Topic
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <p className="text-muted-foreground">{forum.description}</p>

              {/* Forum Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{forum.topicCount || 0} topics</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{forum.postCount || 0} posts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{forum.participantCount || 0} members</span>
                </div>
              </div>

              {/* Forum Tags */}
              {forum.tags && forum.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {forum.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forum Rules */}
      {forum.rules && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forum Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{forum.rules}</p>
          </CardContent>
        </Card>
      )}

      {/* Topics Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-topics"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pinned">Pinned</SelectItem>
                <SelectItem value="solved">Solved</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest Activity</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => refetchTopics()}
                disabled={topicsLoading}
                data-testid="button-refresh-topics"
              >
                <RefreshCw className={`h-4 w-4 ${topicsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      {topicsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? "No topics found matching your criteria."
                : "No topics yet. Be the first to start a discussion!"}
            </p>
            {canCreateTopics && !searchQuery && statusFilter === 'all' && (
              <Button 
                onClick={() => setIsCreateTopicOpen(true)}
                className="mt-4"
                data-testid="button-create-first-topic"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Topic
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic) => {
            const StatusIcon = topicStatusConfig[topic.status]?.icon || MessageCircle;
            const statusConfig = topicStatusConfig[topic.status];
            
            return (
              <Link key={topic.id} href={`/forums/${forumId}/topics/${topic.id}`}>
                <Card className="hover-elevate" data-testid={`card-topic-${topic.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex flex-col items-center space-y-1 min-w-16">
                          <div className={`p-2 rounded-full bg-muted ${statusConfig?.color || 'text-blue-600'}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          {topic.isPinned && (
                            <Pin className="w-3 h-3 text-yellow-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                                {topic.title}
                              </h3>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {topic.description}
                                </p>
                              )}
                              
                              {/* Topic Tags */}
                              {topic.tags && topic.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {topic.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                  {topic.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{topic.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Topic Meta */}
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{topic.authorName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDistanceToNow(new Date(topic.createdAt))} ago</span>
                                </div>
                                {forum.forumType === 'qa' && topic.bountyPoints > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {topic.bountyPoints} pts
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Topic Stats */}
                        <div className="flex flex-col items-center space-y-3 text-sm text-muted-foreground min-w-20">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">{topic.postCount || 0}</div>
                            <div className="text-xs">replies</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">{topic.viewCount}</div>
                            <div className="text-xs">views</div>
                          </div>
                        </div>

                        {/* Last Activity */}
                        {topic.lastPost && (
                          <div className="flex flex-col items-end space-y-1 min-w-32 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {topic.lastPost.authorAvatar ? (
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={topic.lastPost.authorAvatar} />
                                  <AvatarFallback>{topic.lastPost.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-3 h-3" />
                                </div>
                              )}
                              <div className="text-right">
                                <div className="font-medium text-foreground text-xs truncate max-w-20">
                                  {topic.lastPost.authorName}
                                </div>
                                <div className="text-xs">
                                  {formatDistanceToNow(new Date(topic.lastPost.createdAt))} ago
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            data-testid="button-previous-page"
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10"
                  data-testid={`button-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}