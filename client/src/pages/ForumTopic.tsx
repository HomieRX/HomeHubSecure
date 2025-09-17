import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreVertical,
  Flag,
  Share2,
  Bookmark,
  Lock,
  Pin,
  CheckCircle2,
  XCircle,
  Archive,
  Home,
  User,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown,
  Award,
  Crown,
  Shield,
  Loader2,
  RefreshCw,
  Send,
  Quote,
  Edit,
  Trash2,
  AlertTriangle
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
  authorName?: string;
  authorAvatar?: string;
  userCanEdit?: boolean;
  userCanModerate?: boolean;
}

interface ForumPost {
  id: string;
  topicId: string;
  forumId: string;
  parentPostId?: string;
  postType: 'initial' | 'reply' | 'answer' | 'comment';
  authorId: string;
  content: string;
  attachments?: string[];
  images?: string[];
  status: 'active' | 'pending' | 'approved' | 'flagged' | 'hidden' | 'deleted';
  isAnswer: boolean;
  isAcceptedAnswer: boolean;
  upvotes: number;
  downvotes: number;
  score: number;
  path: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API
  authorName: string;
  authorAvatar?: string;
  authorRole?: 'admin' | 'moderator' | 'member';
  userVote?: 'up' | 'down' | null;
  userCanEdit?: boolean;
  userCanModerate?: boolean;
  replyCount?: number;
}

// Create Post Schema
const createPostSchema = {
  content: '',
  postType: 'reply' as const,
  parentPostId: undefined as string | undefined
};

type CreatePostData = typeof createPostSchema;

const topicStatusConfig = {
  active: { icon: MessageCircle, label: 'Active', color: 'text-blue-600' },
  locked: { icon: Lock, label: 'Locked', color: 'text-gray-600' },
  pinned: { icon: Pin, label: 'Pinned', color: 'text-yellow-600' },
  solved: { icon: CheckCircle2, label: 'Solved', color: 'text-green-600' },
  closed: { icon: XCircle, label: 'Closed', color: 'text-red-600' },
  archived: { icon: Archive, label: 'Archived', color: 'text-gray-500' }
};

const roleIcons = {
  admin: { icon: Crown, color: 'text-yellow-600', label: 'Admin' },
  moderator: { icon: Shield, color: 'text-blue-600', label: 'Moderator' },
  member: { icon: User, color: 'text-gray-600', label: 'Member' }
};

export default function ForumTopic() {
  const params = useParams<{ forumId: string; topicId: string }>();
  const { forumId, topicId } = params;
  
  const [replyToPost, setReplyToPost] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;
  
  // Create Post Form
  const postForm = useForm<CreatePostData>({
    resolver: zodResolver,
    defaultValues: createPostSchema
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const replyFormRef = useRef<HTMLDivElement>(null);

  // Fetch forum details
  const {
    data: forum,
    isLoading: forumLoading
  } = useQuery<Forum>({
    queryKey: ['/api/forums', forumId],
    staleTime: 5 * 60 * 1000,
    enabled: !!forumId
  });

  // Fetch topic details
  const {
    data: topic,
    isLoading: topicLoading,
    error: topicError
  } = useQuery<ForumTopic>({
    queryKey: ['/api/forums', forumId, 'topics', topicId],
    staleTime: 5 * 60 * 1000,
    retry: 3,
    enabled: !!forumId && !!topicId
  });

  // Fetch topic posts
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery<{ posts: ForumPost[]; topic: ForumTopic; pagination: { limit: number; offset: number } }>({
    queryKey: ['/api/forums', forumId, 'topics', topicId, 'posts', {
      page: currentPage,
      limit: postsPerPage,
      includeVotes: true,
      includeAuthor: true
    }],
    staleTime: 2 * 60 * 1000,
    retry: 3,
    enabled: !!forumId && !!topicId
  });

  // Get current user for permissions
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user']
  });

  // Post creation mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      return apiRequest('POST', `/api/forums/${forumId}/topics/${topicId}/posts`, {
        ...postData,
        topicId,
        forumId
      });
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your post has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forums', forumId, 'topics', topicId, 'posts'] });
      setShowReplyForm(false);
      setReplyToPost(null);
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

  // Vote mutation with optimistic updates
  const voteMutation = useMutation({
    mutationFn: async ({ postId, voteType }: { postId: string; voteType: 'up' | 'down' }) => {
      return apiRequest('POST', `/api/forums/posts/${postId}/vote`, { voteType });
    },
    onMutate: async ({ postId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/forums', forumId, 'topics', topicId, 'posts'] });
      const previousData = queryClient.getQueryData(['/api/forums', forumId, 'topics', topicId, 'posts']);
      
      if (previousData && typeof previousData === 'object' && 'posts' in previousData) {
        const typedData = previousData as { posts: ForumPost[]; topic: ForumTopic; pagination: any };
        const updatedPosts = typedData.posts.map(post => {
          if (post.id === postId) {
            let newUpvotes = post.upvotes;
            let newDownvotes = post.downvotes;
            
            // Handle vote changes
            if (post.userVote === voteType) {
              // Removing existing vote
              if (voteType === 'up') newUpvotes--;
              else newDownvotes--;
            } else {
              // Adding or changing vote
              if (post.userVote === 'up') newUpvotes--;
              if (post.userVote === 'down') newDownvotes--;
              if (voteType === 'up') newUpvotes++;
              else newDownvotes++;
            }
            
            return {
              ...post,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              score: newUpvotes - newDownvotes,
              userVote: post.userVote === voteType ? null : voteType
            };
          }
          return post;
        });
        
        queryClient.setQueryData(['/api/forums', forumId, 'topics', topicId, 'posts'], {
          ...typedData,
          posts: updatedPosts
        });
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/forums', forumId, 'topics', topicId, 'posts'], context.previousData);
      }
      toast({
        title: "Error voting",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forums', forumId, 'topics', topicId, 'posts'] });
    },
  });

  // Remove vote mutation
  const removeVoteMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('DELETE', `/api/forums/posts/${postId}/vote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forums', forumId, 'topics', topicId, 'posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing vote",
        description: error.message || "Failed to remove vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Flag post mutation
  const flagPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('POST', `/api/forums/posts/${postId}/flag`, {
        reason: 'inappropriate',
        description: 'Flagged by user'
      });
    },
    onSuccess: () => {
      toast({
        title: "Post flagged",
        description: "The post has been flagged for moderation review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error flagging post",
        description: error.message || "Failed to flag post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept answer mutation (for Q&A forums)
  const acceptAnswerMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('POST', `/api/forums/posts/${postId}/accept-answer`);
    },
    onSuccess: () => {
      toast({
        title: "Answer accepted!",
        description: "The answer has been marked as accepted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forums', forumId, 'topics', topicId] });
      queryClient.invalidateQueries({ queryKey: ['/api/forums', forumId, 'topics', topicId, 'posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error accepting answer",
        description: error.message || "Failed to accept answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Organize posts in threaded structure
  const organizedPosts = useMemo(() => {
    if (!postsData?.posts) return [];
    
    const posts = postsData.posts;
    const postMap = new Map(posts.map(post => [post.id, post]));
    const rootPosts: ForumPost[] = [];
    
    // First pass: identify root posts (no parent or parent doesn't exist)
    posts.forEach(post => {
      if (!post.parentPostId || !postMap.has(post.parentPostId)) {
        rootPosts.push(post);
      }
    });
    
    // Sort root posts - initial post first, then by creation time or votes for Q&A
    rootPosts.sort((a, b) => {
      if (a.postType === 'initial') return -1;
      if (b.postType === 'initial') return 1;
      
      if (forum?.forumType === 'qa') {
        // For Q&A, sort by accepted answer first, then by score
        if (a.isAcceptedAnswer) return -1;
        if (b.isAcceptedAnswer) return 1;
        return b.score - a.score;
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    return rootPosts;
  }, [postsData?.posts, forum?.forumType]);

  // Get replies for a post
  const getReplies = (parentId: string): ForumPost[] => {
    if (!postsData?.posts) return [];
    
    const replies = postsData.posts.filter(post => post.parentPostId === parentId);
    return replies.sort((a, b) => {
      if (forum?.forumType === 'qa') {
        return b.score - a.score; // Higher scored replies first for Q&A
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  // Form submission handler
  const onCreatePost = async (data: CreatePostData) => {
    createPostMutation.mutate({
      ...data,
      parentPostId: replyToPost || undefined
    });
  };

  // Handle vote
  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    voteMutation.mutate({ postId, voteType });
  };

  // Handle reply
  const handleReply = (postId: string) => {
    setReplyToPost(postId);
    setShowReplyForm(true);
    setTimeout(() => {
      replyFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Scroll to reply form when showing
  useEffect(() => {
    if (showReplyForm && replyFormRef.current) {
      replyFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showReplyForm]);

  // Handle loading state
  if (topicLoading || forumLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
          <div className="h-8 bg-muted rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (topicError || !topic) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Topic Not Found</h1>
          <div className="text-destructive">
            <p>Unable to load topic details</p>
            <Link href={`/forums/${forumId}`}>
              <Button className="mt-2">
                <Home className="h-4 w-4 mr-2" />
                Back to Forum
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = topicStatusConfig[topic.status]?.icon || MessageCircle;
  const statusConfig = topicStatusConfig[topic.status];
  const canReply = forum?.canPost && !topic.isLocked && topic.status === 'active';

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/forums" data-testid="breadcrumb-forums">Forums</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/forums/${forumId}`} data-testid="breadcrumb-forum">
              {forum?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-48 truncate">{topic.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Topic Header */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-full bg-muted ${statusConfig?.color || 'text-blue-600'}`}>
                  <StatusIcon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-foreground leading-tight">{topic.title}</h1>
                    {topic.isPinned && (
                      <Pin className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {statusConfig?.label}
                    </Badge>
                    {topic.isSolved && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Solved
                      </Badge>
                    )}
                    {forum?.forumType === 'qa' && topic.bountyPoints > 0 && (
                      <Badge variant="secondary">
                        <Award className="w-3 h-3 mr-1" />
                        {topic.bountyPoints} pts
                      </Badge>
                    )}
                  </div>

                  {topic.description && (
                    <p className="text-muted-foreground">{topic.description}</p>
                  )}
                  
                  {/* Topic Tags */}
                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {topic.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Topic Actions */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" data-testid="button-share-topic">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" data-testid="button-bookmark-topic">
                  <Bookmark className="w-4 h-4" />
                </Button>
                {canReply && (
                  <Button 
                    onClick={() => setShowReplyForm(true)}
                    data-testid="button-reply-topic"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                )}
              </div>
            </div>

            {/* Topic Meta */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                {topic.authorAvatar ? (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={topic.authorAvatar} />
                    <AvatarFallback>{topic.authorName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>Created by <strong>{topic.authorName}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(topic.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{topic.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{topic.postCount || 0} replies</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {postsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : organizedPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No posts in this topic yet.</p>
            {canReply && (
              <Button 
                onClick={() => setShowReplyForm(true)}
                className="mt-4"
                data-testid="button-create-first-post"
              >
                <Plus className="h-4 w-4 mr-2" />
                Be the first to post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {organizedPosts.map((post) => {
            const replies = getReplies(post.id);
            const RoleIcon = roleIcons[post.authorRole || 'member']?.icon || User;
            const roleConfig = roleIcons[post.authorRole || 'member'];
            
            return (
              <div key={post.id} className="space-y-4">
                {/* Main Post */}
                <Card className={`${post.postType === 'initial' ? 'border-l-4 border-l-primary' : ''} ${post.isAcceptedAnswer ? 'border-l-4 border-l-green-500' : ''}`}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Post Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {post.authorAvatar ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={post.authorAvatar} />
                              <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{post.authorName}</h3>
                              {post.authorRole && post.authorRole !== 'member' && (
                                <Badge variant="outline" className={`text-xs ${roleConfig.color}`}>
                                  <RoleIcon className="w-3 h-3 mr-1" />
                                  {roleConfig.label}
                                </Badge>
                              )}
                              {post.postType === 'initial' && (
                                <Badge variant="secondary" className="text-xs">
                                  Original Post
                                </Badge>
                              )}
                              {post.isAcceptedAnswer && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Accepted Answer
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.createdAt))} ago
                            </p>
                          </div>
                        </div>
                        
                        {/* Post Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-post-actions-${post.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canReply && (
                              <DropdownMenuItem onClick={() => handleReply(post.id)}>
                                <Reply className="w-4 h-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Quote className="w-4 h-4 mr-2" />
                              Quote
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {post.userCanEdit && (
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => flagPostMutation.mutate(post.id)}>
                              <Flag className="w-4 h-4 mr-2" />
                              Flag
                            </DropdownMenuItem>
                            {post.userCanModerate && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Post Content */}
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
                      </div>

                      {/* Post Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {post.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="rounded-lg border max-h-48 object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {/* Post Actions Bar */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center space-x-4">
                          {/* Voting */}
                          <div className="flex items-center space-x-1">
                            <Button
                              variant={post.userVote === 'up' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => handleVote(post.id, 'up')}
                              disabled={voteMutation.isPending}
                              data-testid={`button-upvote-${post.id}`}
                            >
                              <ArrowUp className="w-4 h-4" />
                              {post.upvotes > 0 && <span className="ml-1">{post.upvotes}</span>}
                            </Button>
                            {post.score !== 0 && (
                              <span className={`text-sm font-medium ${post.score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {post.score > 0 ? '+' : ''}{post.score}
                              </span>
                            )}
                            <Button
                              variant={post.userVote === 'down' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => handleVote(post.id, 'down')}
                              disabled={voteMutation.isPending}
                              data-testid={`button-downvote-${post.id}`}
                            >
                              <ArrowDown className="w-4 h-4" />
                              {post.downvotes > 0 && <span className="ml-1">{post.downvotes}</span>}
                            </Button>
                          </div>

                          {/* Accept Answer Button (for Q&A topics) */}
                          {forum?.forumType === 'qa' && 
                           post.postType === 'answer' && 
                           !post.isAcceptedAnswer && 
                           currentUser?.id === topic.authorId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acceptAnswerMutation.mutate(post.id)}
                              disabled={acceptAnswerMutation.isPending}
                              data-testid={`button-accept-answer-${post.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Accept Answer
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {replies.length > 0 && (
                            <span>{replies.length} replies</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Replies */}
                {replies.map((reply) => {
                  const ReplyRoleIcon = roleIcons[reply.authorRole || 'member']?.icon || User;
                  const replyRoleConfig = roleIcons[reply.authorRole || 'member'];
                  
                  return (
                    <Card key={reply.id} className={`ml-8 ${reply.isAcceptedAnswer ? 'border-l-4 border-l-green-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Reply Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {reply.authorAvatar ? (
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={reply.authorAvatar} />
                                  <AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">{reply.authorName}</h4>
                                  {reply.authorRole && reply.authorRole !== 'member' && (
                                    <Badge variant="outline" className={`text-xs ${replyRoleConfig.color}`}>
                                      <ReplyRoleIcon className="w-3 h-3 mr-1" />
                                      {replyRoleConfig.label}
                                    </Badge>
                                  )}
                                  {reply.isAcceptedAnswer && (
                                    <Badge variant="outline" className="text-xs text-green-600">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Accepted Answer
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.createdAt))} ago
                                </p>
                              </div>
                            </div>
                            
                            {/* Reply Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`button-reply-actions-${reply.id}`}>
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canReply && (
                                  <DropdownMenuItem onClick={() => handleReply(reply.id)}>
                                    <Reply className="w-3 h-3 mr-2" />
                                    Reply
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Quote className="w-3 h-3 mr-2" />
                                  Quote
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => flagPostMutation.mutate(reply.id)}>
                                  <Flag className="w-3 h-3 mr-2" />
                                  Flag
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Reply Content */}
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-foreground text-sm">{reply.content}</p>
                          </div>

                          {/* Reply Actions Bar */}
                          <div className="flex items-center justify-between border-t pt-3">
                            <div className="flex items-center space-x-3">
                              {/* Voting */}
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant={reply.userVote === 'up' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => handleVote(reply.id, 'up')}
                                  disabled={voteMutation.isPending}
                                  data-testid={`button-upvote-${reply.id}`}
                                  className="h-7 w-7 p-0"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                {reply.score !== 0 && (
                                  <span className={`text-xs font-medium ${reply.score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {reply.score > 0 ? '+' : ''}{reply.score}
                                  </span>
                                )}
                                <Button
                                  variant={reply.userVote === 'down' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => handleVote(reply.id, 'down')}
                                  disabled={voteMutation.isPending}
                                  data-testid={`button-downvote-${reply.id}`}
                                  className="h-7 w-7 p-0"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Accept Answer Button (for Q&A replies) */}
                              {forum?.forumType === 'qa' && 
                               !reply.isAcceptedAnswer && 
                               currentUser?.id === topic.authorId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => acceptAnswerMutation.mutate(reply.id)}
                                  disabled={acceptAnswerMutation.isPending}
                                  data-testid={`button-accept-answer-${reply.id}`}
                                  className="h-7 text-xs px-2"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Accept
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <Card ref={replyFormRef}>
          <CardHeader>
            <CardTitle className="text-lg">
              {replyToPost ? 'Reply to Post' : 'Add a Reply'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...postForm}>
              <form onSubmit={postForm.handleSubmit(onCreatePost)} className="space-y-4">
                <FormField
                  control={postForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Reply</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your reply..."
                          rows={6}
                          data-testid="textarea-reply-content"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyToPost(null);
                      postForm.reset();
                    }}
                    disabled={createPostMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    data-testid="button-submit-reply"
                  >
                    {createPostMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <Send className="w-4 h-4 mr-2" />
                    Post Reply
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => refetchPosts()}
          disabled={postsLoading}
          data-testid="button-refresh-posts"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${postsLoading ? 'animate-spin' : ''}`} />
          Refresh Posts
        </Button>
      </div>
    </div>
  );
}