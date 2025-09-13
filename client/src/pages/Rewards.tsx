import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Gift, 
  Star, 
  Trophy, 
  Target,
  Zap,
  Crown,
  Award,
  Coins,
  TrendingUp,
  Calendar,
  Users,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'discount' | 'service' | 'merchandise' | 'experience';
  value: string;
  expiresAt?: Date;
  isAvailable: boolean;
  imageUrl?: string;
  redemptionLimit?: number;
  currentRedemptions?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsAwarded: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface Transaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus';
  points: number;
  description: string;
  date: Date;
  relatedActivity?: string;
}

export default function Rewards() {
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Mock user data
  const userLoyaltyData = {
    currentPoints: 2847,
    totalEarned: 5240,
    totalRedeemed: 2393,
    memberSince: new Date(2023, 2, 15),
    currentTier: 'HomeHERO',
    nextTier: 'HomeGURU',
    pointsToNextTier: 653,
    totalTiers: 4,
  };

  // Mock data - in real app this would come from API
  const [rewards, setRewards] = useState<Reward[]>([
    {
      id: '1',
      name: '$25 Service Credit',
      description: 'Apply $25 credit to any HomeHub service',
      pointsRequired: 500,
      category: 'discount',
      value: '$25',
      isAvailable: true,
      redemptionLimit: 4,
      currentRedemptions: 1
    },
    {
      id: '2',
      name: 'Free HVAC Filter',
      description: 'Complimentary high-quality HVAC filter with installation',
      pointsRequired: 300,
      category: 'service',
      value: '$35 value',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'HomeHub Tool Kit',
      description: 'Premium 20-piece home maintenance toolkit',
      pointsRequired: 1200,
      category: 'merchandise',
      value: '$89 value',
      isAvailable: true,
      redemptionLimit: 1,
      currentRedemptions: 0
    },
    {
      id: '4',
      name: 'Priority Support Access',
      description: '6 months of priority customer support and expedited scheduling',
      pointsRequired: 800,
      category: 'service',
      value: '$150 value',
      isAvailable: true,
    },
    {
      id: '5',
      name: '$100 Gift Card',
      description: 'HomeHub services gift card - perfect for gifting or future use',
      pointsRequired: 2000,
      category: 'discount',
      value: '$100',
      isAvailable: true,
      expiresAt: new Date(2025, 11, 31)
    },
    {
      id: '6',
      name: 'Smart Home Consultation',
      description: 'Professional smart home setup consultation and basic installation',
      pointsRequired: 1500,
      category: 'experience',
      value: '$200 value',
      isAvailable: false,
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      name: 'First Timer',
      description: 'Complete your first service request',
      icon: 'star',
      pointsAwarded: 50,
      isUnlocked: true,
      unlockedAt: new Date(2023, 2, 20)
    },
    {
      id: '2',
      name: 'Maintenance Master',
      description: 'Complete 5 preventive maintenance services',
      icon: 'wrench',
      pointsAwarded: 200,
      isUnlocked: true,
      unlockedAt: new Date(2023, 8, 15)
    },
    {
      id: '3',
      name: 'Review Rockstar',
      description: 'Leave 10 service reviews',
      icon: 'star',
      pointsAwarded: 100,
      isUnlocked: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: '4',
      name: 'Loyalty Legend',
      description: 'Maintain membership for 1 year',
      icon: 'crown',
      pointsAwarded: 500,
      isUnlocked: true,
      unlockedAt: new Date(2024, 2, 15)
    },
    {
      id: '5',
      name: 'Referral Champion',
      description: 'Refer 5 new members',
      icon: 'users',
      pointsAwarded: 300,
      isUnlocked: false,
      progress: 2,
      maxProgress: 5
    }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'earned',
      points: 150,
      description: 'HVAC Service Completion',
      date: new Date(2025, 8, 10),
      relatedActivity: 'Service Request #1234'
    },
    {
      id: '2',
      type: 'earned',
      points: 50,
      description: 'Service Review Submitted',
      date: new Date(2025, 8, 10),
      relatedActivity: 'Review for Mike Johnson'
    },
    {
      id: '3',
      type: 'redeemed',
      points: -300,
      description: 'Free HVAC Filter Redeemed',
      date: new Date(2025, 8, 5),
    },
    {
      id: '4',
      type: 'bonus',
      points: 100,
      description: 'Monthly Membership Bonus',
      date: new Date(2025, 8, 1),
    },
    {
      id: '5',
      type: 'earned',
      points: 200,
      description: 'Plumbing Repair Completion',
      date: new Date(2025, 7, 28),
      relatedActivity: 'Service Request #1230'
    }
  ]);

  const availableRewards = rewards.filter(reward => reward.isAvailable);
  
  const categoryColors = {
    discount: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    service: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    merchandise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    experience: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'redeemed':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-purple-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  const canAfford = (pointsRequired: number) => {
    return userLoyaltyData.currentPoints >= pointsRequired;
  };

  const tierProgress = (userLoyaltyData.currentPoints / (userLoyaltyData.currentPoints + userLoyaltyData.pointsToNextTier)) * 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Rewards - LoyalizeiT!
          </h1>
          <p className="text-muted-foreground">Earn points and redeem exclusive rewards</p>
        </div>
      </div>

      {/* Loyalty Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Points Balance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Your Loyalty Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{userLoyaltyData.currentPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Available Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{userLoyaltyData.totalEarned.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{userLoyaltyData.totalRedeemed.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Redeemed</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{userLoyaltyData.currentTier}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {userLoyaltyData.pointsToNextTier} points to {userLoyaltyData.nextTier}
                </span>
              </div>
              <Progress value={tierProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membership Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Member Since</span>
              <span className="font-medium">{format(userLoyaltyData.memberSince, 'MMM yyyy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Tier</span>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {userLoyaltyData.currentTier}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Achievements</span>
              <span className="font-medium">{achievements.filter(a => a.isUnlocked).length}/{achievements.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rewards" data-testid="tab-rewards">Available Rewards</TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Points History</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map((reward) => (
              <Card key={reward.id} className={`hover-elevate ${canAfford(reward.pointsRequired) ? '' : 'opacity-60'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                      <Badge className={categoryColors[reward.category]}>
                        {reward.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{reward.pointsRequired}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-600">{reward.value}</span>
                    {reward.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        Expires {format(reward.expiresAt, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  {reward.redemptionLimit && (
                    <div className="text-xs text-muted-foreground">
                      {reward.currentRedemptions || 0}/{reward.redemptionLimit} redeemed
                    </div>
                  )}
                  
                  <Button
                    className="w-full"
                    disabled={!canAfford(reward.pointsRequired)}
                    onClick={() => {
                      setSelectedReward(reward);
                      setIsRedeemOpen(true);
                    }}
                    data-testid={`button-redeem-${reward.id}`}
                  >
                    {canAfford(reward.pointsRequired) ? 'Redeem' : 'Insufficient Points'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.isUnlocked ? 'border-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${achievement.isUnlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                      {achievement.isUnlocked ? (
                        <Trophy className="h-6 w-6 text-primary" />
                      ) : (
                        <Target className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{achievement.name}</h3>
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-primary" />
                          <span className="text-sm font-medium">{achievement.pointsAwarded}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      
                      {achievement.isUnlocked ? (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Award className="h-3 w-3" />
                          <span>Unlocked {achievement.unlockedAt ? format(achievement.unlockedAt, 'MMM d, yyyy') : 'recently'}</span>
                        </div>
                      ) : achievement.progress !== undefined && achievement.maxProgress !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1" />
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Not started</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(transaction.date, 'MMM d, yyyy')}
                          {transaction.relatedActivity && ` • ${transaction.relatedActivity}`}
                        </p>
                      </div>
                    </div>
                    <div className={`font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">{selectedReward.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedReward.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-medium text-green-600">{selectedReward.value}</span>
                  <span className="font-bold text-primary">{selectedReward.pointsRequired} points</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Your current balance: {userLoyaltyData.currentPoints} points</p>
                <p>Remaining after redemption: {userLoyaltyData.currentPoints - selectedReward.pointsRequired} points</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Handle redemption logic here
                setIsRedeemOpen(false);
                setSelectedReward(null);
              }}
              data-testid="button-confirm-redeem"
            >
              Confirm Redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}