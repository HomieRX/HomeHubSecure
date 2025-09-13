import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Activity, 
  Plus, 
  Heart,
  MessageSquare,
  Share2,
  Image,
  Star,
  Award,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface TimelinePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: 'text' | 'photo' | 'question' | 'tip' | 'achievement';
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
  tags?: string[];
  images?: string[];
  location?: string;
  group?: string;
}

export default function Timeline() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', type: 'text', tags: '' });

  // Mock data - in real app this would come from API
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([
    {
      id: '1',
      authorId: 'user1',
      authorName: 'Sarah DIY Queen',
      content: 'Just finished my kitchen backsplash project! Used subway tiles with dark grout for a modern look. The transformation is incredible! Here are some before and after shots.',
      type: 'photo',
      timestamp: new Date(2025, 8, 13, 14, 30),
      likes: 34,
      comments: 12,
      isLiked: true,
      tags: ['Kitchen', 'Backsplash', 'Tile', 'DIY'],
      images: ['kitchen-before.jpg', 'kitchen-after.jpg'],
      group: 'DIY Home Projects'
    },
    {
      id: '2',
      authorId: 'user2',
      authorName: 'Mike Builder',
      content: 'Quick tip: When installing trim, always use a nail set to countersink your finish nails. Fill the holes with wood putty and sand smooth before painting for a professional look. This extra step makes all the difference!',
      type: 'tip',
      timestamp: new Date(2025, 8, 13, 11, 15),
      likes: 28,
      comments: 7,
      isLiked: false,
      tags: ['Carpentry', 'Tips', 'Trim', 'Professional'],
      group: 'DIY Home Projects'
    },
    {
      id: '3',
      authorId: 'user3',
      authorName: 'Green Thumb Gary',
      content: 'My tomatoes are looking fantastic this season! Anyone else having success with cherry tomatoes this year? What varieties are working best for you in the Texas heat? I\'ve had great luck with Sun Gold and Black Cherry varieties.',
      type: 'question',
      timestamp: new Date(2025, 8, 12, 16, 45),
      likes: 19,
      comments: 15,
      isLiked: false,
      tags: ['Tomatoes', 'Vegetables', 'Texas', 'Gardening'],
      images: ['tomato-plants.jpg'],
      group: 'Garden Enthusiasts'
    },
    {
      id: '4',
      authorId: 'user4',
      authorName: 'Tech Tom',
      content: 'Just upgraded to smart switches throughout my house. The scheduling and remote control features are absolute game changers! Installation was much easier than I expected, and the app integration is seamless.',
      type: 'text',
      timestamp: new Date(2025, 8, 12, 9, 20),
      likes: 23,
      comments: 9,
      isLiked: true,
      tags: ['Smart Switches', 'Home Automation', 'Technology'],
      group: 'Smart Home Tech'
    },
    {
      id: '5',
      authorId: 'user5',
      authorName: 'Eco Emma',
      content: 'Achievement unlocked! I managed to reduce my energy bill by 30% this month thanks to the new LED lights and programmable thermostat. Small changes really do add up to big savings!',
      type: 'achievement',
      timestamp: new Date(2025, 8, 11, 19, 10),
      likes: 41,
      comments: 18,
      isLiked: true,
      tags: ['Energy Savings', 'LED', 'Smart Thermostat', 'Achievement'],
      group: 'Energy Efficient Homes'
    },
    {
      id: '6',
      authorId: 'user6',
      authorName: 'Handy Hannah',
      content: 'Has anyone dealt with a squeaky door hinge that won\'t stop no matter how much oil you use? I\'ve tried WD-40, 3-in-1 oil, and even graphite powder. The squeak keeps coming back after a few days.',
      type: 'question',
      timestamp: new Date(2025, 8, 11, 14, 35),
      likes: 16,
      comments: 22,
      isLiked: false,
      tags: ['Door Repair', 'Maintenance', 'Help'],
      group: 'DIY Home Projects'
    }
  ]);

  const postTypes = ['All', 'Text', 'Photo', 'Question', 'Tip', 'Achievement'];

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="h-4 w-4" />;
      case 'question':
        return <MessageSquare className="h-4 w-4" />;
      case 'tip':
        return <Star className="h-4 w-4" />;
      case 'achievement':
        return <Award className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'photo':
        return 'text-purple-600';
      case 'question':
        return 'text-blue-600';
      case 'tip':
        return 'text-yellow-600';
      case 'achievement':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredPosts = timelinePosts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesType = typeFilter === 'all' || post.type === typeFilter.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const toggleLike = (postId: string) => {
    setTimelinePosts(posts => 
      posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const createPost = () => {
    const post: TimelinePost = {
      id: Date.now().toString(),
      authorId: 'current-user',
      authorName: 'You',
      content: newPost.content,
      type: newPost.type as TimelinePost['type'],
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      isLiked: false,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    setTimelinePosts(posts => [post, ...posts]);
    setNewPost({ content: '', type: 'text', tags: '' });
    setIsCreatePostOpen(false);
  };

  const stats = {
    totalPosts: timelinePosts.length,
    totalLikes: timelinePosts.reduce((sum, post) => sum + post.likes, 0),
    totalComments: timelinePosts.reduce((sum, post) => sum + post.comments, 0),
    myPosts: timelinePosts.filter(post => post.authorId === 'current-user').length
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Community Timeline
          </h1>
          <p className="text-muted-foreground">Stay updated with the latest community posts and discussions</p>
        </div>
        
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-post">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your thoughts, questions, or tips with the community.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Post Type</label>
                <Select value={newPost.type} onValueChange={(value) => setNewPost({...newPost, type: value})}>
                  <SelectTrigger data-testid="select-post-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Post</SelectItem>
                    <SelectItem value="photo">Photo Post</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="tip">Tip/Advice</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="What would you like to share?"
                  rows={4}
                  data-testid="input-post-content"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                  placeholder="DIY, Kitchen, Tips"
                  data-testid="input-post-tags"
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={createPost} disabled={!newPost.content} data-testid="button-submit-post">
                Share Post
              </Button>
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
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-semibold">{stats.totalPosts}</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-semibold text-red-600">{stats.totalLikes}</p>
              </div>
              <Heart className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comments</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.totalComments}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Posts</p>
                <p className="text-2xl font-semibold text-green-600">{stats.myPosts}</p>
              </div>
              <Star className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts, authors, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-posts"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-post-type-filter">
                <SelectValue placeholder="Post Type" />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Posts */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={post.authorAvatar} />
                  <AvatarFallback>
                    {post.authorName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{post.authorName}</span>
                    {post.group && (
                      <>
                        <span className="text-muted-foreground">in</span>
                        <Badge variant="outline">{post.group}</Badge>
                      </>
                    )}
                    <div className={`p-1 rounded-full ${getPostTypeColor(post.type)}`}>
                      {getPostTypeIcon(post.type)}
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(post.timestamp, 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-sm leading-relaxed">{post.content}</p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {post.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                          <span className="sr-only">{image}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className="flex items-center gap-1"
                      data-testid={`button-like-${post.id}`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{post.likes}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Be the first to share something with the community!'}
            </p>
            {!searchQuery && typeFilter === 'all' && (
              <Button onClick={() => setIsCreatePostOpen(true)} data-testid="button-create-first-post">
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}