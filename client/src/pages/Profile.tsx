import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Camera, Upload, Edit3, Save, Star, Shield, 
  User, UserCheck, Building2, Store, 
  Home, MapPin, Phone, Mail, 
  CreditCard, Award, Calendar, Bell 
} from 'lucide-react';
import {
  UserProfileUpdateSchema,
  MemberProfileCreateSchema,
  MemberProfileUpdateSchema,
  ContractorProfileCreateSchema, 
  ContractorProfileUpdateSchema,
  MerchantProfileCreateSchema,
  MerchantProfileUpdateSchema
} from '@shared/types';
import type { 
  UserProfileUpdate,
  MemberProfileCreate,
  MemberProfileUpdate,
  ContractorProfileCreate,
  ContractorProfileUpdate,
  MerchantProfileCreate,
  MerchantProfileUpdate
} from '@shared/types';
import type { 
  NotificationSettings,
  InsertNotificationSettings
} from '@shared/schema';
import { insertNotificationSettingsSchema } from '@shared/schema';

// Types for different profile sections
type UserProfile = {
  id: string;
  username: string;
  email: string;
  role: 'homeowner' | 'contractor' | 'merchant' | 'admin';
  isActive: boolean;
  lastLoginAt?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    profileImageUrl?: string;
    bio?: string;
    preferredLanguage?: string;
    timezone?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
};

type MemberProfile = {
  id: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  membershipTier: 'HomeHUB' | 'HomePRO' | 'HomeHERO' | 'HomeGURU';
  bio?: string;
  location?: string;
  loyaltyPoints: number;
  createdAt: string;
};

type ProfileState = {
  user: UserProfile | null;
  memberProfile: any | null;
  contractorProfile: any | null;
  merchantProfile: any | null;
  isLoading: boolean;
  error: string | null;
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current user data
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery<UserProfile>({
    queryKey: ['/api/auth/user'],
    retry: false
  });

  // Fetch member profile if user is homeowner
  const { data: memberProfile, isLoading: memberLoading, error: memberError } = useQuery<MemberProfile>({
    queryKey: ['/api/members/by-user', currentUser?.id || 'no-user'],
    enabled: !!currentUser?.id && currentUser.role === 'homeowner',
    retry: false
  });

  // Fetch contractor profile if user is contractor
  const { data: contractorProfile, isLoading: contractorLoading, error: contractorError } = useQuery<any>({
    queryKey: ['/api/contractors/by-user', currentUser?.id || 'no-user'],
    enabled: !!currentUser?.id && currentUser.role === 'contractor',
    retry: false
  });

  // Fetch merchant profile if user is merchant 
  const { data: merchantProfile, isLoading: merchantLoading, error: merchantError } = useQuery<any>({
    queryKey: ['/api/merchants/by-user', currentUser?.id || 'no-user'],
    enabled: !!currentUser?.id && currentUser.role === 'merchant',
    retry: false
  });

  // Fetch notification settings for current user
  const { data: notificationSettings, isLoading: notificationLoading, error: notificationError } = useQuery<NotificationSettings>({
    queryKey: ['/api/notification-settings'],
    enabled: !!currentUser?.id,
    retry: false
  });

  // Form for user profile updates
  const userForm = useForm<UserProfileUpdate>({
    resolver: zodResolver(UserProfileUpdateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      bio: '',
      displayName: '',
      location: ''
    }
  });

  // Form for member profile
  const memberForm = useForm<MemberProfileUpdate>({
    resolver: zodResolver(MemberProfileUpdateSchema),
    defaultValues: {}
  });

  // Form for contractor profile
  const contractorForm = useForm<ContractorProfileUpdate>({
    resolver: zodResolver(ContractorProfileUpdateSchema),
    defaultValues: {}
  });

  // Form for merchant profile
  const merchantForm = useForm<MerchantProfileUpdate>({
    resolver: zodResolver(MerchantProfileUpdateSchema),
    defaultValues: {}
  });

  // Form for notification settings
  const notificationForm = useForm<Partial<InsertNotificationSettings>>({
    resolver: zodResolver(
      insertNotificationSettingsSchema.omit({ userId: true }).partial()
    ),
    defaultValues: {
      // Mentions
      mentions: true,
      // Posts & Comments
      postReplies: true,
      // Account Settings
      passwordChanged: true,
      // Activity Feeds
      activityFeedReplies: true,
      // Social Groups
      groupDetailsUpdated: true,
      groupPromotion: true,
      groupInviteReceived: true,
      groupJoinRequest: true,
      groupJoinAccepted: true,
      groupJoinRejected: true,
      groupNewPost: true,
      groupNewDiscussion: true,
      // Discussion Forums
      forumNewDiscussion: true,
      forumNewReply: true,
      // Private Messages
      privateMessages: true,
      // Member Connections
      connectionRequest: true,
      connectionAccepted: true,
    }
  });

  // Update form values when data loads
  useEffect(() => {
    if (currentUser) {
      userForm.reset({
        firstName: currentUser.profile?.firstName || '',
        lastName: currentUser.profile?.lastName || '',
        bio: currentUser.profile?.bio || '',
        displayName: currentUser.username || '',
        location: ''
      });
    }
  }, [currentUser, userForm]);

  useEffect(() => {
    if (memberProfile) {
      memberForm.reset(memberProfile);
    }
  }, [memberProfile, memberForm]);

  useEffect(() => {
    if (contractorProfile) {
      contractorForm.reset(contractorProfile);
    }
  }, [contractorProfile, contractorForm]);

  useEffect(() => {
    if (merchantProfile) {
      merchantForm.reset(merchantProfile);
    }
  }, [merchantProfile, merchantForm]);

  useEffect(() => {
    if (notificationSettings) {
      notificationForm.reset({
        mentions: notificationSettings.mentions,
        postReplies: notificationSettings.postReplies,
        passwordChanged: notificationSettings.passwordChanged,
        activityFeedReplies: notificationSettings.activityFeedReplies,
        groupDetailsUpdated: notificationSettings.groupDetailsUpdated,
        groupPromotion: notificationSettings.groupPromotion,
        groupInviteReceived: notificationSettings.groupInviteReceived,
        groupJoinRequest: notificationSettings.groupJoinRequest,
        groupJoinAccepted: notificationSettings.groupJoinAccepted,
        groupJoinRejected: notificationSettings.groupJoinRejected,
        groupNewPost: notificationSettings.groupNewPost,
        groupNewDiscussion: notificationSettings.groupNewDiscussion,
        forumNewDiscussion: notificationSettings.forumNewDiscussion,
        forumNewReply: notificationSettings.forumNewReply,
        privateMessages: notificationSettings.privateMessages,
        connectionRequest: notificationSettings.connectionRequest,
        connectionAccepted: notificationSettings.connectionAccepted,
      });
    }
  }, [notificationSettings, notificationForm]);

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mutations for profile updates
  const updateUserMutation = useMutation({
    mutationFn: (data: UserProfileUpdate) => 
      apiRequest('PUT', `/api/users/${currentUser?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Success', description: 'User profile updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update user profile',
        variant: 'destructive' 
      });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: (data: MemberProfileUpdate) => {
      if (!memberProfile?.id) {
        throw new Error('Member profile ID is required for update');
      }
      return apiRequest('PUT', `/api/members/${memberProfile.id}`, data);
    },
    onSuccess: () => {
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/members/by-user', currentUser.id] });
      }
      toast({ title: 'Success', description: 'Member profile updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update member profile',
        variant: 'destructive' 
      });
    }
  });

  const updateContractorMutation = useMutation({
    mutationFn: (data: ContractorProfileUpdate) => {
      if (!contractorProfile?.id) {
        throw new Error('Contractor profile ID is required for update');
      }
      return apiRequest('PUT', `/api/contractors/${contractorProfile.id}`, data);
    },
    onSuccess: () => {
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/contractors/by-user', currentUser.id] });
      }
      toast({ title: 'Success', description: 'Contractor profile updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update contractor profile',
        variant: 'destructive' 
      });
    }
  });

  const updateMerchantMutation = useMutation({
    mutationFn: (data: MerchantProfileUpdate) => {
      if (!merchantProfile?.id) {
        throw new Error('Merchant profile ID is required for update');
      }
      return apiRequest('PUT', `/api/merchants/${merchantProfile.id}`, data);
    },
    onSuccess: () => {
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/merchants/by-user', currentUser.id] });
      }
      toast({ title: 'Success', description: 'Merchant profile updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update merchant profile',
        variant: 'destructive' 
      });
    }
  });

  const updateNotificationMutation = useMutation({
    mutationFn: (data: Partial<InsertNotificationSettings>) => 
      apiRequest('PUT', '/api/notification-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings'] });
      toast({ title: 'Success', description: 'Notification settings updated successfully' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update notification settings',
        variant: 'destructive' 
      });
    }
  });

  // Submit handlers
  const onSubmitUser = (data: UserProfileUpdate) => {
    updateUserMutation.mutate(data);
  };

  const onSubmitMember = (data: MemberProfileUpdate) => {
    updateMemberMutation.mutate(data);
  };

  const onSubmitContractor = (data: ContractorProfileUpdate) => {
    updateContractorMutation.mutate(data);
  };

  const onSubmitMerchant = (data: MerchantProfileUpdate) => {
    updateMerchantMutation.mutate(data);
  };

  const onSubmitNotifications = (data: Partial<InsertNotificationSettings>) => {
    updateNotificationMutation.mutate(data);
  };

  const getMembershipColor = (tier: string) => {
    switch (tier) {
      case 'HomeGURU':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'HomeHERO':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'HomePRO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'contractor':
        return <UserCheck className="h-4 w-4" />;
      case 'merchant':
        return <Store className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'homeowner':
        return 'Homeowner';
      case 'contractor':
        return 'Contractor';
      case 'merchant':
        return 'Merchant';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  // Loading state
  if (userLoading || memberLoading || contractorLoading || merchantLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication error - show sign in message
  if (userError && (userError as any).message?.includes('401')) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <User className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="font-medium">Please sign in to view your profile</p>
                <p className="text-muted-foreground text-sm">
                  You need to be authenticated to access profile settings.
                </p>
              </div>
              <Button data-testid="button-sign-in">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Other errors
  if (userError) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">Failed to load profile</p>
              <p className="text-muted-foreground text-sm">
                Please try refreshing the page or contact support if the issue persists.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                data-testid="button-retry"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No user found (still loading or no session)
  if (!currentUser) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Member Profile</h1>
          <p className="text-muted-foreground">Manage your HomeHub profile and preferences</p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button
              onClick={() => {
                if (currentUser?.role === 'homeowner' && memberProfile) {
                  onSubmitMember(memberForm.getValues());
                } else if (currentUser?.role === 'contractor' && contractorProfile) {
                  onSubmitContractor(contractorForm.getValues());
                } else if (currentUser?.role === 'merchant' && merchantProfile) {
                  onSubmitMerchant(merchantForm.getValues());
                } else {
                  onSubmitUser(userForm.getValues());
                }
              }}
              disabled={
                updateUserMutation.isPending || 
                updateMemberMutation.isPending || 
                updateContractorMutation.isPending || 
                updateMerchantMutation.isPending ||
                !currentUser ||
                (currentUser.role === 'homeowner' && !memberProfile) ||
                (currentUser.role === 'contractor' && !contractorProfile) ||
                (currentUser.role === 'merchant' && !merchantProfile)
              }
              data-testid="button-save-profile"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateUserMutation.isPending || updateMemberMutation.isPending || updateContractorMutation.isPending || updateMerchantMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'outline' : 'default'}
            data-testid={isEditing ? 'button-cancel-edit' : 'button-edit-profile'}
          >
            {isEditing ? 'Cancel' : <><Edit3 className="h-4 w-4 mr-2" />Edit Profile</>}
          </Button>
        </div>
      </div>

      {/* Cover Image Section */}
      <Card>
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
            {(coverImagePreview || memberProfile?.coverImageUrl) ? (
              <img 
                src={coverImagePreview || memberProfile?.coverImageUrl || ''} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
            )}
            {isEditing && (
              <label className="absolute bottom-4 right-4 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                  data-testid="input-cover-image"
                />
                <Button size="sm" className="gap-2" data-testid="button-change-cover">
                  <Camera className="h-4 w-4" />
                  Change Cover
                </Button>
              </label>
            )}
          </div>
          
          {/* Avatar Section */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 bg-amber-600 rounded-lg border-4 border-background flex items-center justify-center overflow-hidden">
                {(avatarPreview || memberProfile?.avatarUrl) ? (
                  <img 
                    src={avatarPreview || memberProfile?.avatarUrl || ''} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {(memberProfile?.nickname || currentUser?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    data-testid="input-avatar"
                  />
                  <Button size="icon" className="h-6 w-6" data-testid="button-change-avatar">
                    <Camera className="h-3 w-3" />
                  </Button>
                </label>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="pt-16 pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold" data-testid="text-member-nickname">
                  {memberProfile?.nickname || currentUser?.username || 'Member'}
                </h2>
                <Badge className={getMembershipColor(memberProfile?.membershipTier || 'HomeHUB')}>
                  <Shield className="h-3 w-3 mr-1" />
                  {memberProfile?.membershipTier || 'HomeHUB'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Member since {new Date(memberProfile?.createdAt || currentUser?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium" data-testid="text-loyalty-points">
                  {memberProfile?.loyaltyPoints || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Loyalty Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
          {currentUser?.role === 'homeowner' && memberProfile ? (
            <Form {...memberForm}>
              <form onSubmit={memberForm.handleSubmit(onSubmitMember)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={memberForm.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-nickname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={memberForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            disabled={!isEditing}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={memberForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={memberForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={memberForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={memberForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={memberForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          rows={4}
                          placeholder="Tell us about yourself..."
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={updateMemberMutation.isPending || !memberProfile}
                      data-testid="button-save-member-profile"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-changes"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          ) : (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={userForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          rows={4}
                          placeholder="Tell us about yourself..."
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <div className="flex gap-2">
                    <Button type="submit" data-testid="button-save-profile">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-changes"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <p className="text-muted-foreground">
                Customize what notifications you receive from HomeHub
              </p>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                  
                  {/* Mentions Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Mentions</h3>
                    <FormField
                      control={notificationForm.control}
                      name="mentions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mentions (@)</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone mentions you in posts or comments
                            </p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-mentions"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Posts & Comments Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Posts & Comments</h3>
                    <FormField
                      control={notificationForm.control}
                      name="postReplies"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Post Replies</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone replies to your posts
                            </p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-post-replies"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Account Settings Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Settings</h3>
                    <FormField
                      control={notificationForm.control}
                      name="passwordChanged"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Password Changes</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified when your password is changed
                            </p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-password-changed"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Activity Feeds Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Activity Feeds</h3>
                    <FormField
                      control={notificationForm.control}
                      name="activityFeedReplies"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Activity Feed Replies</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified about replies to your activity feed posts
                            </p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-activity-feed-replies"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Social Groups Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Groups</h3>
                    <div className="grid gap-4">
                      <FormField
                        control={notificationForm.control}
                        name="groupDetailsUpdated"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Group Updates</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified when group details are updated
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-group-updates"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="groupPromotion"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Group Promotions</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified about group promotions and special offers
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-group-promotions"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="groupInviteReceived"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Group Invites</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified when you receive group invitations
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-group-invites"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="groupJoinRequest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Join Requests</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified about group join requests (if you're an admin)
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-join-requests"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="groupJoinAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Join Requests Accepted</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified when your group join requests are accepted
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-join-accepted"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="groupJoinRejected"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Join Requests Rejected</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified when your group join requests are rejected
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-join-rejected"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="groupNewPost"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">New Group Posts</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified about new posts in your groups
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-new-posts"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="groupNewDiscussion"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">New Group Discussions</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified about new discussions in your groups
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-new-discussions"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Discussion Forums Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Discussion Forums</h3>
                    <div className="grid gap-4">
                      <FormField
                        control={notificationForm.control}
                        name="forumNewDiscussion"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">New Forum Discussions</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified about new discussions in forums you follow
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-forum-discussions"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="forumNewReply"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Forum Replies</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified about replies to forum discussions you participate in
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-forum-replies"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Private Messages Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Private Messages</h3>
                    <FormField
                      control={notificationForm.control}
                      name="privateMessages"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Private Messages</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Get notified when you receive private messages
                            </p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-private-messages"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Member Connections Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Member Connections</h3>
                    <div className="grid gap-4">
                      <FormField
                        control={notificationForm.control}
                        name="connectionRequest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Connection Requests</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified when someone wants to connect with you
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-connection-requests"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="connectionAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Connection Accepted</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get notified when your connection requests are accepted
                              </p>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-connection-accepted"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={updateNotificationMutation.isPending}
                        data-testid="button-save-notifications"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateNotificationMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        data-testid="button-cancel-notification-changes"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}