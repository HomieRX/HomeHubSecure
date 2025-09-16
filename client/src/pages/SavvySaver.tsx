import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Search,
  Percent,
  Tag,
  Clock,
  MapPin,
  Star,
  Gift,
  Zap,
  Calendar,
  Filter,
  Heart,
  Share2
} from "lucide-react";

interface Deal {
  id: string;
  title: string;
  description: string;
  merchantName: string;
  merchantId: string;
  category: string;
  discountType: string;
  discountValue: number;
  originalPrice?: number;
  salePrice?: number;
  validFrom: string;
  validUntil: string;
  location: string;
  featured: boolean;
  isActive: boolean;
  terms: string;
  imageUrl?: string;
  usageLimit?: number;
  usedCount?: number;
}

export default function SavvySaver() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDiscountType, setSelectedDiscountType] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch deals data
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["/api/admin/deals"],
    select: (data: any[]) => data || []
  });

  // Filter and sort deals
  const filteredDeals = deals
    .filter((deal: Deal) => deal.isActive)
    .filter((deal: Deal) => {
      const matchesSearch = 
        deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || 
        deal.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesDiscountType = !selectedDiscountType ||
        deal.discountType?.toLowerCase() === selectedDiscountType.toLowerCase();

      // Check if deal is still valid
      const now = new Date();
      const validUntil = new Date(deal.validUntil);
      const isValid = validUntil > now;

      return matchesSearch && matchesCategory && matchesDiscountType && isValid;
    })
    .sort((a: Deal, b: Deal) => {
      switch (sortBy) {
        case "featured":
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.discountValue || 0) - (a.discountValue || 0);
        case "discount":
          return (b.discountValue || 0) - (a.discountValue || 0);
        case "newest":
          return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
        case "ending":
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
        case "merchant":
          return a.merchantName?.localeCompare(b.merchantName || "") || 0;
        default:
          return 0;
      }
    });

  // Get unique categories and discount types for filters
  const categories = [...new Set(deals.map((d: Deal) => d.category).filter(Boolean))];
  const discountTypes = [...new Set(deals.map((d: Deal) => d.discountType).filter(Boolean))];

  const toggleFavorite = (dealId: string) => {
    setFavorites(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const formatDiscount = (deal: Deal) => {
    if (deal.discountType === "percentage") {
      return `${deal.discountValue}% OFF`;
    } else if (deal.discountType === "fixed") {
      return `$${deal.discountValue} OFF`;
    } else if (deal.discountType === "bogo") {
      return "Buy 1 Get 1 FREE";
    }
    return `${deal.discountValue}% OFF`;
  };

  const getDaysRemaining = (validUntil: string) => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Percent className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Savvy Saver</h1>
        </div>
        <p className="text-muted-foreground">
          Discover exclusive deals and discounts from local merchants
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            {deals.filter((d: Deal) => d.isActive).length} Active Deals
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            {deals.filter((d: Deal) => d.featured).length} Featured
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Find Your Perfect Deal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-deal-search"
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

            {/* Discount Type Filter */}
            <Select value={selectedDiscountType} onValueChange={setSelectedDiscountType}>
              <SelectTrigger data-testid="select-discount-type">
                <SelectValue placeholder="All Discount Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {discountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="discount">Highest Discount</SelectItem>
                <SelectItem value="newest">Newest Deals</SelectItem>
                <SelectItem value="ending">Ending Soon</SelectItem>
                <SelectItem value="merchant">Merchant A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDeals.length} deals available
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedDiscountType("");
          }}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal: Deal) => {
            const daysRemaining = getDaysRemaining(deal.validUntil);
            const isFavorited = favorites.includes(deal.id);
            
            return (
              <Card 
                key={deal.id} 
                className={`hover-elevate transition-all duration-200 relative ${
                  deal.featured ? "ring-2 ring-primary ring-opacity-50" : ""
                }`}
                data-testid={`card-deal-${deal.id}`}
              >
                {deal.featured && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-primary">
                    <Zap className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {deal.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {deal.merchantName}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(deal.id)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-favorite-${deal.id}`}
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          }`} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-testid={`button-share-${deal.id}`}
                      >
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {/* Discount Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                      {formatDiscount(deal)}
                    </Badge>
                    {deal.originalPrice && deal.salePrice && (
                      <div className="text-sm">
                        <span className="line-through text-muted-foreground">
                          ${deal.originalPrice}
                        </span>
                        <span className="font-semibold text-foreground ml-2">
                          ${deal.salePrice}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {deal.category}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {deal.description}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {deal.location}
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={daysRemaining <= 3 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                      {daysRemaining === 1 ? "Expires tomorrow" : 
                       daysRemaining <= 0 ? "Expires today" :
                       `${daysRemaining} days left`}
                    </span>
                  </div>

                  {/* Usage Info */}
                  {deal.usageLimit && (
                    <div className="text-xs text-muted-foreground">
                      {deal.usedCount || 0} / {deal.usageLimit} claimed
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" data-testid={`button-claim-${deal.id}`}>
                      Claim Deal
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-details-${deal.id}`}>
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredDeals.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deals found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or check back later for new deals
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedDiscountType("");
            }}>
              Browse All Deals
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}