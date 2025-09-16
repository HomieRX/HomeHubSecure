import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Search,
  Trophy,
  Target,
  Check,
  Lock,
  Calendar,
  Star,
  Zap,
  Award,
  Gift,
  Users,
  Home,
  DollarSign,
  Filter
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  points: number;
  isSecret: boolean;
  isEarned: boolean;
  earnedDate?: string;
  progressCurrent?: number;
  progressTotal?: number;
  requirements: string[];
  rewards: string[];
  iconType: string;
}

// Mock achievement data - replace with actual API call
const mockAchievements: Achievement[] = [
  {
    id: "1",
    name: "Welcome Home",
    description: "Complete your profile and take your first step into HomeHub",
    category: "Getting Started",
    difficulty: "easy",
    points: 100,
    isSecret: false,
    isEarned: true,
    earnedDate: "2024-01-15",
    progressCurrent: 3,
    progressTotal: 3,
    requirements: ["Upload profile photo", "Complete basic info", "Verify email"],
    rewards: ["100 points", "Profile badge", "Welcome bonus"],
    iconType: "home"
  },
  {
    id: "2",
    name: "Speed Demon",
    description: "Complete 5 service requests in a single week",
    category: "Service Expert",
    difficulty: "medium",
    points: 500,
    isSecret: false,
    isEarned: true,
    earnedDate: "2024-02-10",
    progressCurrent: 5,
    progressTotal: 5,
    requirements: ["Complete 5 service requests", "Within 7 days", "All must be successful"],
    rewards: ["500 points", "Speed badge", "Priority support for 1 month"],
    iconType: "zap"
  },
  {
    id: "3",
    name: "Review Champion",
    description: "Write 50 detailed reviews and help the community",
    category: "Community",
    difficulty: "hard",
    points: 1000,
    isSecret: false,
    isEarned: false,
    progressCurrent: 32,
    progressTotal: 50,
    requirements: ["Write 50 reviews", "Average rating of 4+ stars", "Include photos in 25 reviews"],
    rewards: ["1000 points", "Community champion badge", "Special reviewer status"],
    iconType: "star"
  },
  {
    id: "4",
    name: "Money Saver Extraordinaire",
    description: "Save $5000 through Savvy Saver deals",
    category: "Savings",
    difficulty: "hard",
    points: 2000,
    isSecret: false,
    isEarned: false,
    progressCurrent: 2150,
    progressTotal: 5000,
    requirements: ["Save $5000 with deals", "Use deals from 10+ merchants", "Maintain 90% deal success rate"],
    rewards: ["2000 points", "Money master badge", "VIP deal access"],
    iconType: "dollar"
  },
  {
    id: "5",
    name: "The Contractor Whisperer",
    description: "Work with 25 different contractors successfully",
    category: "Networking",
    difficulty: "extreme",
    points: 3000,
    isSecret: false,
    isEarned: false,
    progressCurrent: 18,
    progressTotal: 25,
    requirements: ["Work with 25 unique contractors", "Average rating of 4.5+ stars", "Zero disputes"],
    rewards: ["3000 points", "Networking master badge", "Personal contractor concierge"],
    iconType: "users"
  },
  {
    id: "6",
    name: "Secret Achievement",
    description: "???",
    category: "Secret",
    difficulty: "extreme",
    points: 5000,
    isSecret: true,
    isEarned: false,
    requirements: ["???"],
    rewards: ["???"],
    iconType: "trophy"
  }
];

export default function AchievementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [showSecretsOnly, setShowSecretsOnly] = useState(false);

  // Get current user for earned achievements
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  // Filter achievements
  const filteredAchievements = mockAchievements.filter((achievement) => {
    // Don't show secret achievements unless they're earned or user wants to see secrets
    if (achievement.isSecret && !achievement.isEarned && !showSecretsOnly) {
      return false;
    }

    const matchesSearch = 
      achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || selectedCategory === "all" || achievement.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || selectedDifficulty === "all" || achievement.difficulty === selectedDifficulty;
    const matchesEarned = !showEarnedOnly || achievement.isEarned;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesEarned;
  });

  // Get categories and difficulties for filters
  const categories = [...new Set(mockAchievements.map(a => a.category).filter(c => c !== "Secret"))];
  const difficulties = ["easy", "medium", "hard", "extreme"];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
      case "hard": return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200";
      case "extreme": return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAchievementIcon = (iconType: string, isEarned: boolean) => {
    const className = `h-6 w-6 ${isEarned ? "text-yellow-500" : "text-muted-foreground"}`;
    
    switch (iconType) {
      case "home": return <Home className={className} />;
      case "zap": return <Zap className={className} />;
      case "star": return <Star className={className} />;
      case "dollar": return <DollarSign className={className} />;
      case "users": return <Users className={className} />;
      case "trophy": return <Trophy className={className} />;
      default: return <Award className={className} />;
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    return Math.min((current / total) * 100, 100);
  };

  const earnedCount = mockAchievements.filter(a => a.isEarned).length;
  const totalPoints = mockAchievements.filter(a => a.isEarned).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
        </div>
        <p className="text-muted-foreground">
          Complete challenging goals and unlock exclusive rewards
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-500" />
            <span className="font-medium">{earnedCount}</span>
            <span className="text-muted-foreground">/ {mockAchievements.filter(a => !a.isSecret || a.isEarned).length} Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{totalPoints}</span>
            <span className="text-muted-foreground">Points Earned</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-achievement-search"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger data-testid="select-difficulty">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Toggles */}
            <div className="flex gap-2">
              <Button
                variant={showEarnedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowEarnedOnly(!showEarnedOnly)}
                data-testid="button-toggle-earned"
              >
                Earned Only
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={showSecretsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSecretsOnly(!showSecretsOnly)}
                data-testid="button-toggle-secrets"
              >
                Show Secrets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAchievements.length} achievements found
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedDifficulty("");
            setShowEarnedOnly(false);
            setShowSecretsOnly(false);
          }}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAchievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={`transition-all duration-200 ${
              achievement.isEarned 
                ? "ring-2 ring-yellow-500 ring-opacity-50 hover-elevate" 
                : "opacity-85 hover-elevate"
            } ${achievement.isSecret ? "border-purple-300 dark:border-purple-700" : ""}`}
            data-testid={`card-achievement-${achievement.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  achievement.isEarned 
                    ? "bg-yellow-100 dark:bg-yellow-900" 
                    : "bg-muted"
                } ${achievement.isSecret ? "bg-purple-100 dark:bg-purple-900" : ""}`}>
                  {achievement.isSecret && !achievement.isEarned ? (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    getAchievementIcon(achievement.iconType, achievement.isEarned)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {achievement.isSecret && !achievement.isEarned ? "???" : achievement.name}
                    </h3>
                    {achievement.isEarned && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {achievement.isSecret && (
                      <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900">
                        Secret
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getDifficultyColor(achievement.difficulty)}`}>
                      {achievement.difficulty.charAt(0).toUpperCase() + achievement.difficulty.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {achievement.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {achievement.isSecret && !achievement.isEarned ? "This is a secret achievement. Complete it to reveal its details!" : achievement.description}
              </p>

              {/* Progress Bar */}
              {achievement.progressCurrent !== undefined && achievement.progressTotal !== undefined && !achievement.isEarned && !achievement.isSecret && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{achievement.progressCurrent} / {achievement.progressTotal}</span>
                  </div>
                  <Progress value={getProgressPercentage(achievement.progressCurrent, achievement.progressTotal)} className="h-2" />
                </div>
              )}

              {/* Requirements */}
              {!achievement.isSecret || achievement.isEarned ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Requirements
                  </h4>
                  <ul className="space-y-1">
                    {achievement.requirements.map((req, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Rewards */}
              {!achievement.isSecret || achievement.isEarned ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Gift className="h-4 w-4" />
                    Rewards
                  </h4>
                  <ul className="space-y-1">
                    {achievement.rewards.map((reward, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                        {reward}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{achievement.points} points</span>
                </div>
                
                {achievement.isEarned && achievement.earnedDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(achievement.earnedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredAchievements.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or explore different categories
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedDifficulty("");
              setShowEarnedOnly(false);
              setShowSecretsOnly(false);
            }}>
              Show All Achievements
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}