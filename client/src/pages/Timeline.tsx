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
import { insertCommunityPostSchema, type InsertCommunityPost } from '@shared/schema';
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
  Activity, 
  Plus, 
  Heart,
  MessageSquare,
  Share2,
  Image,
  Star,
  Award,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  Users,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

// Type based on the API response structure
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
  // Additional fields from user join
  authorName?: string;
  authorAvatar?: string;
}


export default function Timeline() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

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

  // Fetch timeline posts from API
  const {
    data: timelinePosts = [],
    isLoading,
    error,
    refetch
  } = useQuery<TimelinePost[]>({
    queryKey: ['/api/community/posts'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3
  });

  // Form submission handler
  const onCreatePost = async (data: InsertCommunityPost) => {
    // TODO: Get actual user ID from context/auth
    const postData = {
      ...data,
      authorId: 'temp-user-id', // Replace with actual user ID
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    createPostMutation.mutate(postData);
  };

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
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['/api/community/posts'] });
      
      // Snapshot current value
      const previousPosts = queryClient.getQueryData<TimelinePost[]>(['/api/community/posts']);
      
      // Optimistically update cache
      if (previousPosts) {
        const updatedPosts = previousPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
                isLiked: !isLiked 
              }
            : post
        );
        queryClient.setQueryData(['/api/community/posts'], updatedPosts);
      }
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
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
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
  });

  // Filter and search posts
  const filteredPosts = useMemo(() => {
    if (!timelinePosts.length) return [];
    
    return timelinePosts.filter(post => {
      const matchesSearch = searchQuery === '' ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'popular' && post.likeCount > 10) ||
        (typeFilter === 'recent' && new Date(post.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000));
        
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [timelinePosts, searchQuery, typeFilter]);


  // Handle like toggle
  const handleToggleLike = (postId: string, isLiked: boolean) => {
    likePostMutation.mutate({ postId, isLiked });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Community Timeline</h1>
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Community Timeline</h1>
          <div className="text-destructive">
            <p>Error loading timeline: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Community Timeline</h1>
        <p className="text-muted-foreground">
          Stay connected with your HomeHub community
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{timelinePosts.length}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
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
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {timelinePosts.reduce((acc, post) => acc + post.commentCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Post Button */}
      <div className="flex justify-center">
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-post">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-posts"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-post-filter">
                <SelectValue placeholder="Filter posts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="recent">Recent (24h)</SelectItem>
                <SelectItem value="popular">Popular (10+ likes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Posts */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== 'all' 
                ? "No posts found matching your criteria." 
                : "No posts yet. Be the first to share something!"}
            </p>
            {(searchQuery || typeFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover-elevate">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Post Header */}
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

                  {/* Post Content */}
                  <div className="space-y-3">
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                    
                    {/* Tags */}
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

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLike(post.id, false)} // Assuming not liked for now
                      disabled={likePostMutation.isPending}
                      data-testid={`button-like-${post.id}`}
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
      )}
    </div>
  );
}