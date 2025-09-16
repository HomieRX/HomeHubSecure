import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Search,
  Award,
  Star,
  Trophy,
  Target,
  Lock,
  Check,
  Filter,
  Progress,
  Calendar
} from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  iconUrl?: string;
  requirements: string;
  points: number;
  isEarned: boolean;
  earnedDate?: string;
  progressCurrent?: number;
  progressTotal?: number;
}

// Mock badge data - replace with actual API call
const mockBadges: BadgeData[] = [
  {
    id: "1",
    name: "First Timer",
    description: "Complete your first service request",
    category: "Getting Started",
    rarity: "common",
    requirements: "Submit 1 service request",
    points: 50,
    isEarned: true,
    earnedDate: "2024-01-15",
    progressCurrent: 1,
    progressTotal: 1
  },
  {
    id: "2", 
    name: "Home Helper",
    description: "Complete 10 successful service requests",
    category: "Service Expert",
    rarity: "uncommon",
    requirements: "Complete 10 service requests",
    points: 200,
    isEarned: true,
    earnedDate: "2024-02-20",
    progressCurrent: 10,
    progressTotal: 10
  },
  {
    id: "3",
    name: "Review Master",
    description: "Leave 25 helpful reviews for contractors",
    category: "Community",
    rarity: "rare",
    requirements: "Submit 25 reviews",
    points: 500,
    isEarned: false,
    progressCurrent: 18,
    progressTotal: 25
  },
  {
    id: "4",
    name: "Budget Saver",
    description: "Save $1000 through Savvy Saver deals",
    category: "Savings",
    rarity: "epic",
    requirements: "Save $1000 with deals",
    points: 1000,
    isEarned: false,
    progressCurrent: 350,
    progressTotal: 1000
  },
  {
    id: "5",
    name: "Platform Pioneer",
    description: "Be among the first 100 users to join HomeHub",
    category: "Special",
    rarity: "legendary",
    requirements: "Join in the first 100 users",
    points: 2000,
    isEarned: true,
    earnedDate: "2024-01-01",
    progressCurrent: 1,
    progressTotal: 1
  }
];

export default function BadgesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);

  // Get current user for earned badges
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  // Filter badges
  const filteredBadges = mockBadges.filter((badge) => {
    const matchesSearch = 
      badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.requirements.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || badge.category === selectedCategory;
    const matchesRarity = !selectedRarity || badge.rarity === selectedRarity;
    const matchesEarned = !showEarnedOnly || badge.isEarned;

    return matchesSearch && matchesCategory && matchesRarity && matchesEarned;
  });

  // Get categories and rarities for filters
  const categories = [...new Set(mockBadges.map(b => b.category))];
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "uncommon": return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "rare": return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
      case "epic": return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200";
      case "legendary": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    return Math.min((current / total) * 100, 100);
  };

  const earnedCount = mockBadges.filter(b => b.isEarned).length;
  const totalPoints = mockBadges.filter(b => b.isEarned).reduce((sum, b) => sum + b.points, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Badges</h1>
        </div>
        <p className="text-muted-foreground">
          Earn badges by completing achievements and milestones on HomeHub
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-500" />
            <span className="font-medium">{earnedCount}</span>
            <span className="text-muted-foreground">/ {mockBadges.length} Earned</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{totalPoints}</span>
            <span className="text-muted-foreground">Points</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search badges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-badge-search"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rarity Filter */}
            <Select value={selectedRarity} onValueChange={setSelectedRarity}>
              <SelectTrigger data-testid="select-rarity">
                <SelectValue placeholder="All Rarities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Rarities</SelectItem>
                {rarities.map((rarity) => (
                  <SelectItem key={rarity} value={rarity}>
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Earned Filter */}
            <div className="flex items-center space-x-2">
              <Button
                variant={showEarnedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowEarnedOnly(!showEarnedOnly)}
                data-testid="button-toggle-earned"
              >
                {showEarnedOnly ? "Show All" : "Earned Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredBadges.length} badges found
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedRarity("");
            setShowEarnedOnly(false);
          }}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => (
          <Card 
            key={badge.id} 
            className={`transition-all duration-200 ${
              badge.isEarned 
                ? "ring-2 ring-green-500 ring-opacity-50 hover-elevate" 
                : "opacity-75 hover-elevate"
            }`}
            data-testid={`card-badge-${badge.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  badge.isEarned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {badge.isEarned ? (
                    <Award className="h-6 w-6" />
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {badge.name}
                    </h3>
                    {badge.isEarned && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {badge.description}
              </p>

              {/* Category */}
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {badge.category}
                </Badge>
              </div>

              {/* Requirements */}
              <div className="text-sm">
                <span className="font-medium">Requirements:</span>
                <p className="text-muted-foreground">{badge.requirements}</p>
              </div>

              {/* Progress Bar */}
              {badge.progressCurrent !== undefined && badge.progressTotal !== undefined && !badge.isEarned && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{badge.progressCurrent} / {badge.progressTotal}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(badge.progressCurrent, badge.progressTotal)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Points */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{badge.points} points</span>
                </div>
                
                {badge.isEarned && badge.earnedDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(badge.earnedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredBadges.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No badges found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or explore different categories
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedRarity("");
              setShowEarnedOnly(false);
            }}>
              Show All Badges
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}