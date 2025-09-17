import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Building2, 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail,
  Clock,
  ShoppingBag,
  Percent,
  Award,
  ExternalLink,
  Heart,
  Share2,
  Loader2,
  RefreshCw,
  CheckCircle,
  Filter
} from 'lucide-react';

// Type based on the API response structure
interface Merchant {
  id: string;
  businessName: string;
  website?: string;
  businessType: string;
  businessDescription?: string;
  operatingHours?: any;
  serviceArea: string;
  specialties: string[];
  acceptedPaymentMethods: string[];
  businessImages: string[];
  logoUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  verifiedAt?: string;
  isActive: boolean;
  city: string;
  state: string;
}

export default function Merchants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch merchants from API
  const {
    data: merchants = [],
    isLoading,
    error,
    refetch
  } = useQuery<Merchant[]>({
    queryKey: ['/api/merchants'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Compute filter options from real data
  const categories = useMemo(() => {
    const allCategories = merchants.map(m => m.businessType).filter(Boolean);
    return ['All', ...Array.from(new Set(allCategories))];
  }, [merchants]);

  const locations = useMemo(() => {
    const allLocations = merchants.map(m => `${m.city}, ${m.state}`).filter(Boolean);
    return ['All', ...Array.from(new Set(allLocations))];
  }, [merchants]);

  const verifiedOptions = ['All', 'Verified', 'Unverified'];

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge variant="outline">
        Unverified
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Open
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        Closed
      </Badge>
    );
  };

  const filteredAndSortedMerchants = useMemo(() => {
    if (!merchants.length) return [];
    
    let filtered = merchants.filter(merchant => {
      const location = `${merchant.city}, ${merchant.state}`;
      const matchesSearch = searchQuery === '' || 
        merchant.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.businessDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesCategory = categoryFilter === 'all' || 
        merchant.businessType === categoryFilter;
        
      const matchesLocation = locationFilter === 'all' || 
        location === locationFilter;
        
      const matchesVerified = verifiedFilter === 'all' || 
        (verifiedFilter === 'verified' && merchant.isVerified) ||
        (verifiedFilter === 'unverified' && !merchant.isVerified);
        
      return matchesSearch && matchesCategory && matchesLocation && matchesVerified;
    });

    // Sort merchants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return (a.businessName || '').localeCompare(b.businessName || '');
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [merchants, searchQuery, categoryFilter, locationFilter, verifiedFilter, sortBy]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Merchants</h1>
          <p className="text-muted-foreground">Loading merchants...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Merchants</h1>
          <div className="text-destructive">
            <p>Error loading merchants: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleVisitWebsite = (website?: string) => {
    if (website) {
      window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
    }
  };

  const filteredMerchants = filteredAndSortedMerchants;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Local Merchants</h1>
        <p className="text-muted-foreground">
          Discover trusted local businesses and exclusive HomeHub member deals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{merchants.length}</p>
                <p className="text-sm text-muted-foreground">Total Merchants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{merchants.filter(m => m.isVerified).length}</p>
                <p className="text-sm text-muted-foreground">Verified Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {merchants.length > 0 ? (merchants.reduce((acc, m) => acc + (m.rating || 0), 0) / merchants.length).toFixed(1) : '0.0'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{merchants.filter(m => m.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Currently Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-merchants"
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
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Cards */}
      {filteredMerchants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No merchants found matching your criteria.</p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setLocationFilter('all');
                setVerifiedFilter('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMerchants.map((merchant) => (
            <Card key={merchant.id} className="hover-elevate">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={merchant.logoUrl || merchant.businessImages?.[0]} alt={merchant.businessName} />
                      <AvatarFallback className="text-lg font-semibold">
                        {merchant.businessName?.split(' ').map(n => n[0]).join('') || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{merchant.businessName}</h3>
                          <p className="text-sm text-muted-foreground">{merchant.businessType}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{merchant.rating || 0}</span>
                              <span className="text-sm text-muted-foreground">
                                ({merchant.reviewCount || 0})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getVerificationBadge(merchant.isVerified)}
                          {getStatusBadge(merchant.isActive)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {merchant.businessDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {merchant.businessDescription}
                    </p>
                  )}

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1">
                    {merchant.specialties?.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    )) || []}
                    {(merchant.specialties?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(merchant.specialties?.length || 0) - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Location and Service Area */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{merchant.city}, {merchant.state}</span>
                    </div>
                    {merchant.serviceArea && (
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{merchant.serviceArea}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMerchant(merchant);
                        setIsDetailsOpen(true);
                      }}
                      data-testid={`button-details-${merchant.id}`}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {merchant.website && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVisitWebsite(merchant.website)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMerchant?.businessName}
              {selectedMerchant?.isVerified && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedMerchant?.businessDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Business Type:</span>
                <p className="text-muted-foreground">{selectedMerchant?.businessType}</p>
              </div>
              <div>
                <span className="font-medium">Service Area:</span>
                <p className="text-muted-foreground">{selectedMerchant?.serviceArea}</p>
              </div>
            </div>

            {/* Specialties */}
            {selectedMerchant?.specialties && selectedMerchant.specialties.length > 0 && (
              <div>
                <span className="font-medium text-sm">Specialties:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMerchant.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {selectedMerchant?.acceptedPaymentMethods && selectedMerchant.acceptedPaymentMethods.length > 0 && (
              <div>
                <span className="font-medium text-sm">Payment Methods:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMerchant.acceptedPaymentMethods.map((method) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-medium">{selectedMerchant?.rating || 0}</span>
              <span className="text-sm text-muted-foreground">
                ({selectedMerchant?.reviewCount || 0} reviews)
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedMerchant?.website && (
              <Button onClick={() => handleVisitWebsite(selectedMerchant.website)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}