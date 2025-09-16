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
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Filter,
  Building2,
  Tag,
  Clock
} from "lucide-react";

interface Merchant {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  category: string;
  website?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  description: string;
  hours?: string;
  profileImageUrl?: string;
}

export default function MerchantsDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedZipCode, setSelectedZipCode] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  // Fetch merchants data
  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ["/api/admin/merchantProfiles"],
    select: (data: any[]) => data || []
  });

  // Filter and sort merchants
  const filteredMerchants = merchants
    .filter((merchant: Merchant) => {
      const matchesSearch = 
        merchant.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || 
        merchant.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesZip = !selectedZipCode ||
        merchant.zipCode?.includes(selectedZipCode);

      const matchesCity = !selectedCity ||
        merchant.city?.toLowerCase().includes(selectedCity.toLowerCase());

      return matchesSearch && matchesCategory && matchesZip && matchesCity;
    })
    .sort((a: Merchant, b: Merchant) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "reviews":
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case "name":
          return a.businessName?.localeCompare(b.businessName || "") || 0;
        case "location":
          return a.city?.localeCompare(b.city || "") || 0;
        default:
          return 0;
      }
    });

  // Get unique categories, zip codes, and cities for filters
  const categories = [...new Set(merchants.map((m: Merchant) => m.category).filter(Boolean))];
  const zipCodes = [...new Set(merchants.map((m: Merchant) => m.zipCode).filter(Boolean))];
  const cities = [...new Set(merchants.map((m: Merchant) => m.city).filter(Boolean))];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Merchant Directory</h1>
        <p className="text-muted-foreground">
          Discover local businesses and merchants in your area
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Merchants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-merchant-search"
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

            {/* ZIP Code Filter */}
            <Select value={selectedZipCode} onValueChange={setSelectedZipCode}>
              <SelectTrigger data-testid="select-zipcode">
                <SelectValue placeholder="All ZIP Codes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All ZIP Codes</SelectItem>
                {zipCodes.map((zip) => (
                  <SelectItem key={zip} value={zip}>
                    {zip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Filter */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger data-testid="select-city">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
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
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="location">Location A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredMerchants.length} merchants found
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("");
            setSelectedZipCode("");
            setSelectedCity("");
          }}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>

      {/* Merchants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMerchants.map((merchant: Merchant) => (
            <Card key={merchant.id} className="hover-elevate transition-all duration-200" data-testid={`card-merchant-${merchant.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={merchant.profileImageUrl} />
                    <AvatarFallback>
                      {merchant.businessName?.[0]}{merchant.businessName?.[1]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {merchant.businessName}
                      </h3>
                      {merchant.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {merchant.contactName}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (merchant.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{merchant.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({merchant.reviewCount} reviews)
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {merchant.category}
                  </Badge>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {merchant.city}, {merchant.state} {merchant.zipCode}
                </div>

                {/* Hours */}
                {merchant.hours && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {merchant.hours}
                  </div>
                )}

                {/* Description */}
                {merchant.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {merchant.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" data-testid={`button-contact-${merchant.id}`}>
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  {merchant.website && (
                    <Button variant="outline" size="sm" data-testid={`button-visit-website-${merchant.id}`}>
                      <Globe className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredMerchants.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No merchants found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all merchants
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedZipCode("");
              setSelectedCity("");
            }}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}