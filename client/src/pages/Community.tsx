import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Image
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
}

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

export default function Community() {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>([
    {
      id: '1',
      name: 'DIY Home Projects',
      description: 'Share your DIY home improvement projects, get advice, and inspire others!',
      category: 'DIY & Projects',
      memberCount: 1247,
      isPrivate: false,
      isJoined: true,
      recentActivity: 23,
      tags: ['DIY', 'Home Improvement', 'Projects', 'Tips'],
      createdAt: new Date(2024, 1, 15),
      moderators: ['Sarah DIY Queen', 'Mike Builder'],
      location: 'Austin Area'
    },
    {
      id: '2',
      name: 'Garden Enthusiasts',
      description: 'Connect with fellow gardening enthusiasts, share plant photos, and exchange growing tips.',
      category: 'Gardening',
      memberCount: 856,
      isPrivate: false,
      isJoined: true,
      recentActivity: 45,
      tags: ['Gardening', 'Plants', 'Landscaping', 'Organic'],
      createdAt: new Date(2024, 2, 3),
      moderators: ['Green Thumb Gary'],
      location: 'Central Texas'
    },
    {
      id: '3',
      name: 'Smart Home Tech',
      description: 'Discuss the latest smart home technology, automation tips, and product reviews.',
      category: 'Technology',
      memberCount: 634,
      isPrivate: false,
      isJoined: false,
      recentActivity: 12,
      tags: ['Smart Home', 'Technology', 'Automation', 'Reviews'],
      createdAt: new Date(2024, 3, 10),
      moderators: ['Tech Tom', 'Smart Sally'],
    },
    {
      id: '4',
      name: 'Neighborhood Watch - Cedar Park',
      description: 'Private group for Cedar Park residents to discuss community safety and local updates.',
      category: 'Safety & Security',
      memberCount: 234,
      isPrivate: true,
      isJoined: false,
      recentActivity: 8,
      tags: ['Safety', 'Community', 'Cedar Park', 'Local'],
      createdAt: new Date(2024, 4, 1),
      moderators: ['Officer Johnson'],
      location: 'Cedar Park, TX'
    },
    {
      id: '5',
      name: 'Energy Efficient Homes',
      description: 'Tips and tricks for making your home more energy efficient and environmentally friendly.',
      category: 'Sustainability',
      memberCount: 423,
      isPrivate: false,
      isJoined: true,
      recentActivity: 18,
      tags: ['Energy Efficiency', 'Sustainability', 'Solar', 'Green Living'],
      createdAt: new Date(2024, 0, 20),
      moderators: ['Eco Emma']
    }
  ]);

  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([
    {
      id: '1',
      authorId: 'user1',
      authorName: 'Sarah DIY Queen',
      content: 'Just finished my kitchen backsplash project! Used subway tiles with dark grout for a modern look. The transformation is incredible!',
      type: 'photo',
      timestamp: new Date(2025, 8, 13, 14, 30),
      likes: 34,
      comments: 12,
      isLiked: true,
      tags: ['Kitchen', 'Backsplash', 'Tile'],
      images: ['kitchen-before.jpg', 'kitchen-after.jpg'],
      group: 'DIY Home Projects'
    },
    {
      id: '2',
      authorId: 'user2',
      authorName: 'Mike Builder',
      content: 'Quick tip: When installing trim, always use a nail set to countersink your finish nails. Fill the holes with wood putty and sand smooth before painting for a professional look.',
      type: 'tip',
      timestamp: new Date(2025, 8, 13, 11, 15),
      likes: 28,
      comments: 7,
      isLiked: false,
      tags: ['Carpentry', 'Tips', 'Trim'],
      group: 'DIY Home Projects'
    },
    {
      id: '3',
      authorId: 'user3',
      authorName: 'Green Thumb Gary',
      content: 'My tomatoes are looking fantastic this season! Anyone else having success with cherry tomatoes this year? What varieties are working best for you in Texas heat?',
      type: 'question',
      timestamp: new Date(2025, 8, 12, 16, 45),
      likes: 19,
      comments: 15,
      isLiked: false,
      tags: ['Tomatoes', 'Vegetables', 'Texas Gardening'],
      images: ['tomato-plants.jpg'],
      group: 'Garden Enthusiasts'
    },
    {
      id: '4',
      authorId: 'user4',
      authorName: 'Tech Tom',
      content: 'Just upgraded to smart switches throughout my house. The scheduling and remote control features are game changers! Installation was easier than expected.',
      type: 'text',
      timestamp: new Date(2025, 8, 12, 9, 20),
      likes: 23,
      comments: 9,
      isLiked: true,
      tags: ['Smart Switches', 'Home Automation'],
      group: 'Smart Home Tech'
    },
    {
      id: '5',
      authorId: 'user5',
      authorName: 'Eco Emma',
      content: 'Achieved a 30% reduction in my energy bill this month thanks to the new LED lights and programmable thermostat. Small changes add up!',
      type: 'achievement',
      timestamp: new Date(2025, 8, 11, 19, 10),
      likes: 41,
      comments: 18,
      isLiked: true,
      tags: ['Energy Savings', 'LED', 'Smart Thermostat'],
      group: 'Energy Efficient Homes'
    }
  ]);

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

  const joinedGroups = communityGroups.filter(group => group.isJoined);
  const popularGroups = communityGroups
    .filter(group => !group.isJoined && !group.isPrivate)
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 3);

  const toggleLike = (postId: string) => {
    setTimelinePosts(posts => 
      posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const stats = {
    totalMembers: communityGroups.reduce((sum, group) => sum + group.memberCount, 0),
    activeGroups: communityGroups.filter(group => group.recentActivity > 10).length,
    joinedGroups: joinedGroups.length,
    recentActivity: communityGroups.reduce((sum, group) => sum + group.recentActivity, 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Users2 className="h-6 w-6" />
            Community - CommuniT!
          </h1>
          <p className="text-muted-foreground">Connect with neighbors, share knowledge, and build community</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-post">
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Share updates, ask questions, or post tips with the community.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button data-testid="button-submit-post">Share Post</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
              <DialogFooter>
                <Button data-testid="button-submit-group">Create Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Community Members</p>
                <p className="text-2xl font-semibold">{stats.totalMembers.toLocaleString()}</p>
              </div>
              <Users2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Groups</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.activeGroups}</p>
              </div>
              <UsersRound className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Groups</p>
                <p className="text-2xl font-semibold text-green-600">{stats.joinedGroups}</p>
              </div>
              <Star className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.recentActivity}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            <Activity className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">
            <UsersRound className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Timeline Posts */}
            <div className="lg:col-span-3 space-y-6">
              {timelinePosts.map((post) => (
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
                        </div>
                        
                        <p className="text-sm">{post.content}</p>
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 pt-2">
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
                          </Button>
                          
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(post.timestamp, 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* My Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {joinedGroups.map((group) => (
                    <div key={group.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-medium">
                          {group.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.memberCount} members
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Suggested Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {popularGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <span className="text-secondary-foreground text-xs font-medium">
                            {group.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.memberCount} members
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        data-testid={`button-join-${group.id}`}
                      >
                        Join Group
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityGroups.map((group) => (
              <Card key={group.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{group.name}</h3>
                          {group.isPrivate && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{group.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{group.memberCount}</p>
                        <p className="text-xs text-muted-foreground">members</p>
                      </div>
                    </div>
                    
                    <p className="text-sm">{group.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{group.recentActivity} recent posts</span>
                      </div>
                      {group.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{group.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {group.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {group.isJoined ? (
                        <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${group.id}`}>
                          View Group
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1" data-testid={`button-join-group-${group.id}`}>
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
      </Tabs>
    </div>
  );
}