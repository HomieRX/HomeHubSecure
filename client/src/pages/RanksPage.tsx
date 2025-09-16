import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Crown,
  Award,
  Target,
  TrendingUp,
  Calendar,
  Users,
  Gift,
  Zap
} from "lucide-react";

interface RankData {
  id: string;
  name: string;
  description: string;
  level: number;
  pointsRequired: number;
  pointsToNext?: number;
  benefits: string[];
  iconColor: string;
  isCurrentRank: boolean;
  isEarned: boolean;
  earnedDate?: string;
  userCount?: number;
}

// Mock rank data - replace with actual API call
const mockRanks: RankData[] = [
  {
    id: "1",
    name: "Newcomer",
    description: "Welcome to HomeHub! Start your journey here.",
    level: 1,
    pointsRequired: 0,
    pointsToNext: 500,
    benefits: ["Basic platform access", "Submit service requests", "Basic support"],
    iconColor: "text-gray-500",
    isCurrentRank: false,
    isEarned: true,
    earnedDate: "2024-01-01",
    userCount: 1250
  },
  {
    id: "2", 
    name: "Home Helper",
    description: "You're getting the hang of HomeHub!",
    level: 2,
    pointsRequired: 500,
    pointsToNext: 1000,
    benefits: ["Priority support", "10% discount on services", "Access to exclusive deals"],
    iconColor: "text-green-500",
    isCurrentRank: true,
    isEarned: true,
    earnedDate: "2024-02-15",
    userCount: 850
  },
  {
    id: "3",
    name: "Smart Saver",
    description: "You know how to save money and get things done!",
    level: 3,
    pointsRequired: 1500,
    pointsToNext: 2000,
    benefits: ["15% discount on services", "Early access to deals", "VIP support", "Monthly reward bonus"],
    iconColor: "text-blue-500",
    isCurrentRank: false,
    isEarned: false,
    userCount: 420
  },
  {
    id: "4",
    name: "Home Master",
    description: "A true expert in home management and savings.",
    level: 4,
    pointsRequired: 3500,
    pointsToNext: 3500,
    benefits: ["20% discount on services", "Personal account manager", "Beta feature access", "Quarterly rewards"],
    iconColor: "text-purple-500",
    isCurrentRank: false,
    isEarned: false,
    userCount: 180
  },
  {
    id: "5",
    name: "HomeHub Elite",
    description: "The pinnacle of HomeHub mastery. You've achieved it all!",
    level: 5,
    pointsRequired: 7000,
    benefits: ["25% discount on services", "Concierge service", "Annual VIP events", "Maximum rewards", "Exclusive perks"],
    iconColor: "text-yellow-500",
    isCurrentRank: false,
    isEarned: false,
    userCount: 45
  }
];

export default function RanksPage() {
  const [selectedRank, setSelectedRank] = useState<string | null>(null);

  // Get current user for earned ranks and points
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  // Mock user points - replace with actual data
  const userPoints = 1250;
  const currentRank = mockRanks.find(r => r.isCurrentRank);
  const nextRank = mockRanks.find(r => r.pointsRequired > userPoints && !r.isEarned);

  const getProgressToNext = () => {
    if (!currentRank || !nextRank) return 100;
    const pointsInCurrentTier = userPoints - currentRank.pointsRequired;
    const pointsNeededForNext = nextRank.pointsRequired - currentRank.pointsRequired;
    return (pointsInCurrentTier / pointsNeededForNext) * 100;
  };

  const getRankIcon = (rank: RankData) => {
    switch (rank.level) {
      case 1: return <Users className={`h-6 w-6 ${rank.iconColor}`} />;
      case 2: return <Target className={`h-6 w-6 ${rank.iconColor}`} />;
      case 3: return <Award className={`h-6 w-6 ${rank.iconColor}`} />;
      case 4: return <Star className={`h-6 w-6 ${rank.iconColor}`} />;
      case 5: return <Crown className={`h-6 w-6 ${rank.iconColor}`} />;
      default: return <Users className={`h-6 w-6 ${rank.iconColor}`} />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Ranks</h1>
        </div>
        <p className="text-muted-foreground">
          Climb the ranks and unlock exclusive benefits as you use HomeHub
        </p>
      </div>

      {/* Current Progress Card */}
      <Card className="border-primary border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Current Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentRank && getRankIcon(currentRank)}
              <div>
                <h3 className="font-semibold text-lg">{currentRank?.name}</h3>
                <p className="text-sm text-muted-foreground">Current Rank</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{userPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>

          {nextRank && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextRank.name}</span>
                <span>{nextRank.pointsRequired - userPoints} points needed</span>
              </div>
              <Progress value={getProgressToNext()} className="h-3" />
            </div>
          )}

          {currentRank && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold">Level {currentRank.level}</div>
                <div className="text-sm text-muted-foreground">Current Level</div>
              </div>
              {currentRank.earnedDate && (
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {new Date(currentRank.earnedDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Rank Earned</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-lg font-semibold">{currentRank.userCount?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Users at this rank</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranks Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Rank Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockRanks.map((rank, index) => (
              <div key={rank.id} className="relative">
                {/* Connection line */}
                {index < mockRanks.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
                )}

                <div 
                  className={`flex gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer hover-elevate ${
                    rank.isCurrentRank 
                      ? "ring-2 ring-primary ring-opacity-50 bg-primary/5" 
                      : rank.isEarned 
                      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      : "bg-muted/30"
                  }`}
                  onClick={() => setSelectedRank(selectedRank === rank.id ? null : rank.id)}
                  data-testid={`card-rank-${rank.id}`}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full border-2 flex items-center justify-center ${
                    rank.isCurrentRank 
                      ? "border-primary bg-primary/10" 
                      : rank.isEarned 
                      ? "border-green-500 bg-green-100 dark:bg-green-900"
                      : "border-muted-foreground bg-muted"
                  }`}>
                    {getRankIcon(rank)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{rank.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        Level {rank.level}
                      </Badge>
                      {rank.isCurrentRank && (
                        <Badge className="text-xs bg-primary">
                          Current
                        </Badge>
                      )}
                      {rank.isEarned && !rank.isCurrentRank && (
                        <Badge variant="secondary" className="text-xs">
                          Earned
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {rank.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{rank.pointsRequired.toLocaleString()} points</span>
                      </div>
                      {rank.userCount && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{rank.userCount.toLocaleString()} users</span>
                        </div>
                      )}
                      {rank.earnedDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(rank.earnedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points to next */}
                  {!rank.isEarned && (
                    <div className="text-right text-sm">
                      <div className="font-medium text-foreground">
                        {(rank.pointsRequired - userPoints).toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">points to unlock</div>
                    </div>
                  )}
                </div>

                {/* Expanded Benefits */}
                {selectedRank === rank.id && (
                  <div className="ml-16 mt-4 p-4 bg-card border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Rank Benefits
                    </h4>
                    <ul className="space-y-2">
                      {rank.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Award className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Complete Services</h4>
              <p className="text-sm text-muted-foreground">Earn 100-500 points per completed service request</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Leave Reviews</h4>
              <p className="text-sm text-muted-foreground">Get 25 points for each helpful review</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Gift className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Use Savvy Saver</h4>
              <p className="text-sm text-muted-foreground">Earn 10 points per dollar saved with deals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}