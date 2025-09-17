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
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  Award,
  Clock,
  CheckCircle,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Type based on the API response structure
interface Contractor {
  id: string;
  businessName: string;
  serviceRadius: number;
  hourlyRate: number;
  isVerified: boolean;
  verifiedAt?: string;
  bio?: string;
  specialties: string[];
  certifications: string[];
  yearsExperience: number;
  portfolioImages: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  availability?: any;
  city: string;
  state: string;
}

export default function Contractors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Fetch contractors from API
  const {
    data: contractors = [],
    isLoading,
    error,
    refetch
  } = useQuery<Contractor[]>({
    queryKey: ['/api/contractors'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Compute filter options from real data
  const specialties = useMemo(() => {
    const allSpecialties = contractors.flatMap(c => c.specialties || []);
    return ['All', ...Array.from(new Set(allSpecialties))];
  }, [contractors]);

  const locations = useMemo(() => {
    const allLocations = contractors.map(c => `${c.city}, ${c.state}`).filter(Boolean);
    return ['All', ...Array.from(new Set(allLocations))];
  }, [contractors]);

  const availabilities = ['All', 'Available', 'Unavailable'];
  const ratings = ['All', '4.5+ Stars', '4.0+ Stars', '3.5+ Stars'];

  const getAvailabilityColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getAvailabilityText = (isActive: boolean) => {
    return isActive ? 'Available' : 'Unavailable';
  };

  const filteredAndSortedContractors = useMemo(() => {
    if (!contractors.length) return [];
    
    let filtered = contractors.filter(contractor => {
      const location = `${contractor.city}, ${contractor.state}`;
      const matchesSearch = searchQuery === '' || 
        contractor.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contractor.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesSpecialty = specialtyFilter === 'all' || 
        contractor.specialties?.includes(specialtyFilter);
        
      const matchesLocation = locationFilter === 'all' || 
        location === locationFilter;
        
      const matchesAvailability = availabilityFilter === 'all' || 
        (availabilityFilter === 'available' && contractor.isActive) ||
        (availabilityFilter === 'unavailable' && !contractor.isActive);
        
      const matchesRating = ratingFilter === 'all' || 
        (ratingFilter === '4.5+ stars' && contractor.rating >= 4.5) ||
        (ratingFilter === '4.0+ stars' && contractor.rating >= 4.0) ||
        (ratingFilter === '3.5+ stars' && contractor.rating >= 3.5);
        
      return matchesSearch && matchesSpecialty && matchesLocation && matchesAvailability && matchesRating;
    });

    // Sort contractors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'rate':
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        case 'experience':
          return (b.yearsExperience || 0) - (a.yearsExperience || 0);
        case 'name':
          return (a.businessName || '').localeCompare(b.businessName || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [contractors, searchQuery, specialtyFilter, locationFilter, availabilityFilter, ratingFilter, sortBy]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Contractors</h1>
          <p className="text-muted-foreground">Loading contractors...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Contractors</h1>
          <div className="text-destructive">
            <p>Error loading contractors: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleContactContractor = () => {
    // TODO: Implement contact form submission
    console.log('Contacting contractor:', selectedContractor);
    setIsContactOpen(false);
  };

  const filteredContractors = filteredAndSortedContractors;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Find Contractors</h1>
        <p className="text-muted-foreground">
          Connect with verified contractors in your area for all your home improvement needs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{contractors.length}</p>
                <p className="text-sm text-muted-foreground">Total Contractors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{contractors.filter(c => c.isVerified).length}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
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
                  {contractors.length > 0 ? (contractors.reduce((acc, c) => acc + (c.rating || 0), 0) / contractors.length).toFixed(1) : '0.0'}
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
                <p className="text-2xl font-bold">{contractors.filter(c => c.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Available Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-contractors"
              />
            </div>
            
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger data-testid="select-specialty-filter">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty.toLowerCase()}>
                    {specialty}
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
            
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger data-testid="select-availability-filter">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                {availabilities.map((availability) => (
                  <SelectItem key={availability} value={availability.toLowerCase()}>
                    {availability}
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
                <SelectItem value="rate">Lowest Rate</SelectItem>
                <SelectItem value="experience">Most Experience</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Cards */}
      {filteredContractors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No contractors found matching your criteria.</p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSpecialtyFilter('all');
                setLocationFilter('all');
                setAvailabilityFilter('all');
                setRatingFilter('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredContractors.map((contractor) => (
            <Card key={contractor.id} className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={contractor.portfolioImages?.[0]} alt={contractor.businessName} />
                    <AvatarFallback className="text-lg font-semibold">
                      {contractor.businessName?.split(' ').map(n => n[0]).join('') || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{contractor.businessName}</h3>
                          {contractor.isVerified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contractor.city}, {contractor.state}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{contractor.rating || 0}</span>
                            <span className="text-sm text-muted-foreground">
                              ({contractor.reviewCount || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getAvailabilityColor(contractor.isActive)}>
                        {getAvailabilityText(contractor.isActive)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {contractor.specialties?.slice(0, 3).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        )) || []}
                        {(contractor.specialties?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(contractor.specialties?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{contractor.serviceRadius} mi radius</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${contractor.hourlyRate || 0}/hr</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>{contractor.yearsExperience || 0} years exp.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{contractor.certifications?.length || 0} certs</span>
                        </div>
                      </div>
                      
                      {contractor.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {contractor.bio}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedContractor(contractor);
                          setIsContactOpen(true);
                        }}
                        data-testid={`button-contact-${contractor.id}`}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact {selectedContractor?.businessName}</DialogTitle>
            <DialogDescription>
              Send a message to this contractor about your project needs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="w-full p-3 border rounded-md resize-none"
                placeholder="Describe your project and requirements..."
                rows={4}
                data-testid="textarea-contact-message"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Contact Method</label>
              <Select defaultValue="email">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleContactContractor} data-testid="button-send-message">
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}