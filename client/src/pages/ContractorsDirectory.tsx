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
  Calendar,
  Filter,
  Users,
  Award
} from "lucide-react";

interface Contractor {
  id: string;
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  zipCode: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  yearsExperience: number;
  profileImageUrl?: string;
  bio: string;
}

export default function ContractorsDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  // Fetch contractors data
  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ["/api/admin/contractorProfiles"],
    select: (data: any[]) => data || []
  });

  // Filter and sort contractors
  const filteredContractors = contractors
    .filter((contractor: Contractor) => {
      const matchesSearch = 
        contractor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSpecialty = !selectedSpecialty || selectedSpecialty === "all" || 
        contractor.specialties?.includes(selectedSpecialty);

      const matchesLocation = !selectedLocation || selectedLocation === "all" ||
        contractor.location?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        contractor.zipCode?.includes(selectedLocation);

      return matchesSearch && matchesSpecialty && matchesLocation;
    })
    .sort((a: Contractor, b: Contractor) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "experience":
          return (b.yearsExperience || 0) - (a.yearsExperience || 0);
        case "reviews":
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case "name":
          return a.businessName?.localeCompare(b.businessName || "") || 0;
        default:
          return 0;
      }
    });

  // Get unique specialties and locations for filters
  const specialties = Array.from(new Set(contractors.flatMap((c: Contractor) => c.specialties || [])));
  const locations = Array.from(new Set(contractors.map((c: Contractor) => c.location).filter(Boolean)));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Contractor Directory</h1>
        <p className="text-muted-foreground">
          Find trusted contractors in your area for your home improvement needs
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Contractors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contractors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-contractor-search"
              />
            </div>

            {/* Specialty Filter */}
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger data-testid="select-specialty">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location or ZIP..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-10"
                data-testid="input-location-filter"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="experience">Most Experience</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredContractors.length} contractors found
        </p>
        <Button variant="outline" size="sm" data-testid="button-clear-filters">
          Clear Filters
        </Button>
      </div>

      {/* Contractors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map((contractor: Contractor) => (
            <Card key={contractor.id} className="hover-elevate transition-all duration-200" data-testid={`card-contractor-${contractor.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contractor.profileImageUrl} />
                    <AvatarFallback>
                      {contractor.firstName?.[0]}{contractor.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {contractor.businessName}
                      </h3>
                      {contractor.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contractor.firstName} {contractor.lastName}
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
                          i < (contractor.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{contractor.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({contractor.reviewCount} reviews)
                  </span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1">
                  {contractor.specialties?.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {contractor.specialties?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{contractor.specialties.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {contractor.location} {contractor.zipCode}
                </div>

                {/* Experience */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {contractor.yearsExperience} years experience
                </div>

                {/* Bio */}
                {contractor.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {contractor.bio}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" data-testid={`button-contact-${contractor.id}`}>
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-view-profile-${contractor.id}`}>
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredContractors.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contractors found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all contractors
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedSpecialty("");
              setSelectedLocation("");
            }}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}