import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Percent, 
  Search, 
  Filter,
  MapPin, 
  Star, 
  Clock,
  Tag,
  Calendar,
  ExternalLink,
  Heart,
  Share2,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface Deal {
  id: string;
  title: string;
  description: string;
  merchantName: string;
  merchantId: string;
  category: string;
  discountType: 'percentage' | 'fixed' | 'bogo';
  discountValue: number;
  originalPrice?: number;
  finalPrice?: number;
  validFrom: Date;
  validUntil: Date;
  location: string;
  isExclusive: boolean;
  membershipRequired?: string;
  tags: string[];
  rating: number;
  usedCount: number;
  remainingUses?: number;
  isFavorited: boolean;
  image?: string;
  termsAndConditions: string;
}

export default function SavvySaver() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('expiring-soon');

  // Mock data - in real app this would come from API
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: '1',
      title: '15% Off All Paint Supplies',
      description: 'Get 15% off all paint, brushes, rollers, and painting accessories. Perfect for your next home improvement project!',
      merchantName: 'Austin Home Supply',
      merchantId: '1',
      category: 'Home Improvement',
      discountType: 'percentage',
      discountValue: 15,
      originalPrice: 100,
      finalPrice: 85,
      validFrom: new Date(2025, 8, 1),
      validUntil: new Date(2025, 8, 30),
      location: 'Austin, TX',
      isExclusive: true,
      membershipRequired: 'HomeHUB+',
      tags: ['Paint', 'DIY', 'Home Improvement'],
      rating: 4.8,
      usedCount: 247,
      remainingUses: 50,
      isFavorited: true,
      termsAndConditions: 'Valid on in-store purchases only. Cannot be combined with other offers.'
    },
    {
      id: '2',
      title: 'Free Delivery on Orders $100+',
      description: 'Free delivery service for all garden center purchases over $100. Includes plants, soil, and landscaping supplies.',
      merchantName: 'Green Thumb Nursery',
      merchantId: '2',
      category: 'Garden Center',
      discountType: 'fixed',
      discountValue: 0,
      originalPrice: 25,
      finalPrice: 0,
      validFrom: new Date(2025, 8, 5),
      validUntil: new Date(2025, 9, 15),
      location: 'Round Rock, TX',
      isExclusive: false,
      tags: ['Delivery', 'Plants', 'Landscaping'],
      rating: 4.6,
      usedCount: 89,
      isFavorited: false,
      termsAndConditions: 'Valid for orders placed online or by phone. Delivery within 25 miles of store.'
    },
    {
      id: '3',
      title: 'Buy One Get One 50% Off Tools',
      description: 'Buy any hand tool and get the second one 50% off. Mix and match from our premium tool selection.',
      merchantName: 'ProTools Warehouse',
      merchantId: '3',
      category: 'Tools & Equipment',
      discountType: 'bogo',
      discountValue: 50,
      validFrom: new Date(2025, 8, 10),
      validUntil: new Date(2025, 8, 24),
      location: 'Cedar Park, TX',
      isExclusive: true,
      membershipRequired: 'HomePRO',
      tags: ['Tools', 'BOGO', 'Equipment'],
      rating: 4.9,
      usedCount: 156,
      remainingUses: 25,
      isFavorited: true,
      termsAndConditions: 'Lower priced item receives discount. Valid on hand tools only.'
    },
    {
      id: '4',
      title: '$50 Off Smart Home Installation',
      description: 'Professional smart home device installation service. Save $50 on installations over $200.',
      merchantName: 'Tech Solutions Plus',
      merchantId: '4',
      category: 'Smart Home',
      discountType: 'fixed',
      discountValue: 50,
      originalPrice: 200,
      finalPrice: 150,
      validFrom: new Date(2025, 7, 20),
      validUntil: new Date(2025, 9, 30),
      location: 'Austin, TX',
      isExclusive: false,
      tags: ['Smart Home', 'Installation', 'Technology'],
      rating: 4.7,
      usedCount: 73,
      isFavorited: false,
      termsAndConditions: 'Valid for installations over $200. Scheduled installation required.'
    },
    {
      id: '5',
      title: '20% Off Energy Audit Service',
      description: 'Comprehensive home energy audit with detailed recommendations. Identify savings opportunities!',
      merchantName: 'Eco Energy Solutions',
      merchantId: '5',
      category: 'Energy Efficiency',
      discountType: 'percentage',
      discountValue: 20,
      originalPrice: 300,
      finalPrice: 240,
      validFrom: new Date(2025, 8, 1),
      validUntil: new Date(2025, 10, 31),
      location: 'Georgetown, TX',
      isExclusive: true,
      membershipRequired: 'HomeGURU',
      tags: ['Energy Audit', 'Efficiency', 'Green Living'],
      rating: 4.5,
      usedCount: 34,
      remainingUses: 15,
      isFavorited: false,
      termsAndConditions: 'Residential properties only. Report provided within 5 business days.'
    }
  ]);

  const categories = ['All', 'Home Improvement', 'Garden Center', 'Tools & Equipment', 'Smart Home', 'Energy Efficiency', 'Appliances'];
  const locations = ['All', 'Austin, TX', 'Round Rock, TX', 'Cedar Park, TX', 'Georgetown, TX'];
  const sortOptions = ['Expiring Soon', 'Highest Rated', 'Most Popular', 'Newest', 'Best Discount'];

  const getDiscountDisplay = (deal: Deal) => {
    switch (deal.discountType) {
      case 'percentage':
        return `${deal.discountValue}% OFF`;
      case 'fixed':
        return deal.discountValue === 0 ? 'FREE' : `$${deal.discountValue} OFF`;
      case 'bogo':
        return `BOGO ${deal.discountValue}% OFF`;
      default:
        return 'DEAL';
    }
  };

  const getDiscountColor = (deal: Deal) => {
    if (deal.isExclusive) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getMembershipBadgeColor = (membership?: string) => {
    switch (membership) {
      case 'HomeGURU':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'HomeHERO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HomePRO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isExpiringSoon = (validUntil: Date) => {
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  };

  const toggleFavorite = (dealId: string) => {
    setDeals(deals => 
      deals.map(deal => 
        deal.id === dealId ? { ...deal, isFavorited: !deal.isFavorited } : deal
      )
    );
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = searchQuery === '' || 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = categoryFilter === 'all' || deal.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || deal.location === locationFilter;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const stats = {
    totalDeals: deals.length,
    expiringSoon: deals.filter(deal => isExpiringSoon(deal.validUntil)).length,
    exclusiveDeals: deals.filter(deal => deal.isExclusive).length,
    favoritedDeals: deals.filter(deal => deal.isFavorited).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Percent className="h-6 w-6" />
            Savvy Saver
          </h1>
          <p className="text-muted-foreground">Discover exclusive deals and offers from your favorite local merchants</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-semibold">{stats.totalDeals}</p>
              </div>
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-semibold text-orange-600">{stats.expiringSoon}</p>
              </div>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exclusive</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.exclusiveDeals}</p>
              </div>
              <Star className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorited</p>
                <p className="text-2xl font-semibold text-red-600">{stats.favoritedDeals}</p>
              </div>
              <Heart className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-deals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all-deals" data-testid="tab-all-deals">All Deals</TabsTrigger>
          <TabsTrigger value="favorites" data-testid="tab-favorites">Favorites</TabsTrigger>
          <TabsTrigger value="expiring" data-testid="tab-expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="all-deals" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-deals"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger data-testid="select-location-filter">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location.toLowerCase()}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort-by">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(' ', '-')}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => (
              <Card key={deal.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getDiscountColor(deal)}>
                            {getDiscountDisplay(deal)}
                          </Badge>
                          {deal.isExclusive && (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              <Zap className="h-3 w-3 mr-1" />
                              Exclusive
                            </Badge>
                          )}
                          {isExpiringSoon(deal.validUntil) && (
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Expiring
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{deal.title}</h3>
                        <p className="text-sm text-muted-foreground">{deal.merchantName}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(deal.id)}
                        data-testid={`button-favorite-${deal.id}`}
                      >
                        <Heart className={`h-4 w-4 ${deal.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{deal.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{deal.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>{deal.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Until {format(deal.validUntil, 'MMM d')}</span>
                      </div>
                    </div>
                    
                    {deal.originalPrice && deal.finalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600">${deal.finalPrice}</span>
                        <span className="text-sm text-muted-foreground line-through">${deal.originalPrice}</span>
                        <span className="text-sm text-green-600 font-medium">
                          Save ${deal.originalPrice - deal.finalPrice}
                        </span>
                      </div>
                    )}
                    
                    {deal.membershipRequired && (
                      <Badge className={getMembershipBadgeColor(deal.membershipRequired)}>
                        {deal.membershipRequired} Required
                      </Badge>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {deal.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {deal.remainingUses && deal.remainingUses <= 20 && (
                      <div className="text-xs text-orange-600 font-medium">
                        Only {deal.remainingUses} uses remaining!
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" data-testid={`button-redeem-${deal.id}`}>
                        Redeem Deal
                      </Button>
                      <Button variant="outline" size="icon" data-testid={`button-share-${deal.id}`}>
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" data-testid={`button-view-merchant-${deal.id}`}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.filter(deal => deal.isFavorited).map((deal) => (
              <Card key={deal.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{deal.title}</h3>
                        <p className="text-sm text-muted-foreground">{deal.merchantName}</p>
                      </div>
                      <Badge className={getDiscountColor(deal)}>
                        {getDiscountDisplay(deal)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Expires {format(deal.validUntil, 'MMM d, yyyy')}
                    </div>
                    
                    <Button className="w-full" data-testid={`button-redeem-favorite-${deal.id}`}>
                      Redeem Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.filter(deal => isExpiringSoon(deal.validUntil)).map((deal) => (
              <Card key={deal.id} className="hover-elevate border-orange-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                        <h3 className="font-semibold">{deal.title}</h3>
                        <p className="text-sm text-muted-foreground">{deal.merchantName}</p>
                      </div>
                      <Badge className={getDiscountColor(deal)}>
                        {getDiscountDisplay(deal)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-orange-600 font-medium">
                      Expires {format(deal.validUntil, 'MMM d, yyyy')}
                    </div>
                    
                    <Button className="w-full" data-testid={`button-redeem-expiring-${deal.id}`}>
                      Redeem Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredDeals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No deals found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search filters or check back later for new deals
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setLocationFilter('all');
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}