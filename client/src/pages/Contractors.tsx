import { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';

interface Contractor {
  id: string;
  name: string;
  company: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  location: string;
  distanceFromUser: number;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'booked';
  responseTime: string;
  completedJobs: number;
  yearsExperience: number;
  certifications: string[];
  phone: string;
  email: string;
  bio: string;
  profileImage?: string;
  isVerified: boolean;
  insuranceVerified: boolean;
  backgroundCheckPassed: boolean;
  languages: string[];
  serviceRadius: number;
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

  // Mock data - in real app this would come from API
  const [contractors, setContractors] = useState<Contractor[]>([
    {
      id: '1',
      name: 'Mike Johnson',
      company: 'Johnson Plumbing Services',
      specialties: ['Plumbing', 'Water Heaters', 'Drain Cleaning'],
      rating: 4.9,
      reviewCount: 127,
      location: 'Austin, TX',
      distanceFromUser: 2.3,
      hourlyRate: 85,
      availability: 'available',
      responseTime: '< 1 hour',
      completedJobs: 342,
      yearsExperience: 12,
      certifications: ['Licensed Plumber', 'EPA Certified'],
      phone: '(555) 123-4567',
      email: 'mike@johnsonplumbing.com',
      bio: 'Professional plumber with over 12 years of experience specializing in residential and commercial plumbing repairs.',
      isVerified: true,
      insuranceVerified: true,
      backgroundCheckPassed: true,
      languages: ['English', 'Spanish'],
      serviceRadius: 25
    },
    {
      id: '2',
      name: 'Sarah Davis',
      company: 'Cool Air Solutions',
      specialties: ['HVAC', 'Air Conditioning', 'Heating Systems'],
      rating: 4.8,
      reviewCount: 89,
      location: 'Austin, TX',
      distanceFromUser: 4.1,
      hourlyRate: 95,
      availability: 'busy',
      responseTime: '< 2 hours',
      completedJobs: 156,
      yearsExperience: 8,
      certifications: ['HVAC Certified', 'EPA 608 Certified'],
      phone: '(555) 234-5678',
      email: 'sarah@coolairsolutions.com',
      bio: 'HVAC specialist focused on energy-efficient solutions and preventive maintenance programs.',
      isVerified: true,
      insuranceVerified: true,
      backgroundCheckPassed: true,
      languages: ['English'],
      serviceRadius: 30
    },
    {
      id: '3',
      name: 'Robert Chen',
      company: 'Precision Electric Co.',
      specialties: ['Electrical', 'Smart Home', 'Panel Upgrades'],
      rating: 4.7,
      reviewCount: 203,
      location: 'Round Rock, TX',
      distanceFromUser: 8.2,
      hourlyRate: 110,
      availability: 'available',
      responseTime: '< 30 minutes',
      completedJobs: 428,
      yearsExperience: 15,
      certifications: ['Master Electrician', 'Smart Home Certified'],
      phone: '(555) 345-6789',
      email: 'robert@precisionelectric.com',
      bio: 'Master electrician specializing in smart home installations and electrical panel upgrades.',
      isVerified: true,
      insuranceVerified: true,
      backgroundCheckPassed: true,
      languages: ['English', 'Mandarin'],
      serviceRadius: 20
    },
    {
      id: '4',
      name: 'Tom Wilson',
      company: 'Wilson Handyman Services',
      specialties: ['General Repairs', 'Carpentry', 'Drywall'],
      rating: 4.6,
      reviewCount: 156,
      location: 'Cedar Park, TX',
      distanceFromUser: 12.5,
      hourlyRate: 65,
      availability: 'available',
      responseTime: '< 4 hours',
      completedJobs: 287,
      yearsExperience: 20,
      certifications: ['Licensed Contractor'],
      phone: '(555) 456-7890',
      email: 'tom@wilsonhandyman.com',
      bio: 'Experienced handyman providing quality home repairs and maintenance services for over 20 years.',
      isVerified: true,
      insuranceVerified: true,
      backgroundCheckPassed: true,
      languages: ['English'],
      serviceRadius: 15
    },
    {
      id: '5',
      name: 'Maria Rodriguez',
      company: 'Rodriguez Roofing',
      specialties: ['Roofing', 'Gutter Installation', 'Storm Damage'],
      rating: 4.9,
      reviewCount: 94,
      location: 'Austin, TX',
      distanceFromUser: 6.7,
      hourlyRate: 120,
      availability: 'booked',
      responseTime: '< 6 hours',
      completedJobs: 178,
      yearsExperience: 10,
      certifications: ['Roofing Contractor License', 'Storm Damage Certified'],
      phone: '(555) 567-8901',
      email: 'maria@rodriguezroofing.com',
      bio: 'Specialized roofing contractor with expertise in storm damage repairs and premium roofing materials.',
      isVerified: true,
      insuranceVerified: true,
      backgroundCheckPassed: true,
      languages: ['English', 'Spanish'],
      serviceRadius: 40
    }
  ]);

  const specialties = ['All', 'Plumbing', 'HVAC', 'Electrical', 'General Repairs', 'Roofing', 'Carpentry'];
  const locations = ['All', 'Austin, TX', 'Round Rock, TX', 'Cedar Park, TX', 'Georgetown, TX'];
  const availabilities = ['All', 'Available', 'Busy', 'Booked'];
  const ratings = ['All', '4.5+ Stars', '4.0+ Stars', '3.5+ Stars'];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'booked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filterAndSortContractors = () => {
    let filtered = contractors.filter(contractor => {
      const matchesSearch = searchQuery === '' || 
        contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contractor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contractor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesSpecialty = specialtyFilter === 'all' || 
        contractor.specialties.includes(specialtyFilter);
        
      const matchesLocation = locationFilter === 'all' || 
        contractor.location === locationFilter;
        
      const matchesAvailability = availabilityFilter === 'all' || 
        contractor.availability === availabilityFilter.toLowerCase();
        
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
          return b.rating - a.rating;
        case 'distance':
          return a.distanceFromUser - b.distanceFromUser;
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        case 'experience':
          return b.yearsExperience - a.yearsExperience;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredContractors = filterAndSortContractors();

  const availableContractors = contractors.filter(c => c.availability === 'available').length;
  const averageRating = contractors.reduce((sum, c) => sum + c.rating, 0) / contractors.length;
  const verifiedContractors = contractors.filter(c => c.isVerified && c.insuranceVerified).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Contractors - HandleiT!
          </h1>
          <p className="text-muted-foreground">Browse and connect with verified home service professionals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contractors</p>
                <p className="text-2xl font-semibold">{contractors.length}</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Now</p>
                <p className="text-2xl font-semibold text-green-600">{availableContractors}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-semibold">{averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-semibold text-blue-600">{verifiedContractors}</p>
              </div>
              <Award className="h-5 w-5 text-blue-600" />
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
                <SelectItem value="distance">Closest</SelectItem>
                <SelectItem value="rate">Lowest Rate</SelectItem>
                <SelectItem value="experience">Most Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContractors.map((contractor) => (
          <Card key={contractor.id} className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={contractor.profileImage} alt={contractor.name} />
                  <AvatarFallback className="text-lg font-semibold">
                    {contractor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{contractor.name}</h3>
                        {contractor.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contractor.company}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{contractor.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({contractor.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getAvailabilityColor(contractor.availability)}>
                      {contractor.availability}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {contractor.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {contractor.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{contractor.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{contractor.distanceFromUser} mi away</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Responds {contractor.responseTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${contractor.hourlyRate}/hr</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{contractor.yearsExperience} years exp.</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {contractor.bio}
                    </p>
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
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-view-profile-${contractor.id}`}
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-request-quote-${contractor.id}`}
                    >
                      Request Quote
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContractors.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No contractors found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search filters or expanding your search criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSpecialtyFilter('all');
                setLocationFilter('all');
                setAvailabilityFilter('all');
                setRatingFilter('all');
              }}
              data-testid="button-clear-filters"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Contractor</DialogTitle>
            <DialogDescription>
              Get in touch with {selectedContractor?.name} from {selectedContractor?.company}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContractor && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedContractor.profileImage} />
                  <AvatarFallback>
                    {selectedContractor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedContractor.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedContractor.company}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{selectedContractor.phone}</p>
                  </div>
                  <Button size="sm" className="ml-auto" data-testid="button-call-contractor">
                    Call
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{selectedContractor.email}</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" data-testid="button-email-contractor">
                    Email
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">HomeHub Messages</p>
                    <p className="text-sm text-muted-foreground">Send secure message</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" data-testid="button-message-contractor">
                    Message
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Response time: {selectedContractor.responseTime}</p>
                <p>Service radius: {selectedContractor.serviceRadius} miles</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)}>
              Close
            </Button>
            <Button data-testid="button-schedule-consultation">
              Schedule Consultation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}