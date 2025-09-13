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
  Share2
} from 'lucide-react';

interface Merchant {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  distanceFromUser: number;
  phone: string;
  email: string;
  website?: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  isOpen: boolean;
  specialOffers: string[];
  memberDiscount?: number;
  tags: string[];
  images: string[];
  profileImage?: string;
  isVerified: boolean;
  isPartner: boolean;
  savvySaverDeals: number;
  establishedYear: number;
  acceptedPayments: string[];
}

export default function Merchants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [openFilter, setOpenFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [merchants, setMerchants] = useState<Merchant[]>([
    {
      id: '1',
      name: 'Austin Home Supply',
      category: 'Home Improvement',
      subcategory: 'Hardware Store',
      description: 'Full-service hardware store specializing in home improvement supplies, tools, and expert advice.',
      rating: 4.7,
      reviewCount: 342,
      location: 'Austin, TX',
      address: '1234 Main St, Austin, TX 78701',
      distanceFromUser: 2.1,
      phone: '(512) 555-0123',
      email: 'info@austinhomesupply.com',
      website: 'austinhomesupply.com',
      hours: {
        monday: '7:00 AM - 8:00 PM',
        tuesday: '7:00 AM - 8:00 PM',
        wednesday: '7:00 AM - 8:00 PM',
        thursday: '7:00 AM - 8:00 PM',
        friday: '7:00 AM - 9:00 PM',
        saturday: '7:00 AM - 9:00 PM',
        sunday: '8:00 AM - 6:00 PM'
      },
      isOpen: true,
      specialOffers: ['10% off paint supplies', 'Free delivery on orders over $100'],
      memberDiscount: 15,
      tags: ['Hardware', 'Paint', 'Tools', 'Garden Center'],
      images: ['store-front.jpg', 'hardware-section.jpg'],
      isVerified: true,
      isPartner: true,
      savvySaverDeals: 8,
      establishedYear: 1987,
      acceptedPayments: ['Credit Cards', 'HomeHub Credits', 'Cash']
    },
    {
      id: '2',
      name: 'Green Thumb Nursery',
      category: 'Garden Center',
      subcategory: 'Plants & Landscaping',
      description: 'Premier garden center offering plants, landscaping supplies, and expert gardening advice.',
      rating: 4.8,
      reviewCount: 198,
      location: 'Round Rock, TX',
      address: '5678 Garden Way, Round Rock, TX 78664',
      distanceFromUser: 8.3,
      phone: '(512) 555-0456',
      email: 'hello@greenthumb.com',
      website: 'greenthumb.com',
      hours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 7:00 PM',
        saturday: '7:00 AM - 7:00 PM',
        sunday: '9:00 AM - 5:00 PM'
      },
      isOpen: true,
      specialOffers: ['Spring plant sale - 20% off', 'Free soil testing'],
      memberDiscount: 12,
      tags: ['Plants', 'Landscaping', 'Organic', 'Native Plants'],
      images: ['nursery.jpg', 'plants.jpg'],
      isVerified: true,
      isPartner: true,
      savvySaverDeals: 5,
      establishedYear: 1995,
      acceptedPayments: ['Credit Cards', 'HomeHub Credits', 'Cash', 'PayPal']
    },
    {
      id: '3',
      name: 'Elite Appliance Center',
      category: 'Appliances',
      subcategory: 'Kitchen & Home Appliances',
      description: 'Authorized dealer for major appliance brands with professional installation services.',
      rating: 4.6,
      reviewCount: 156,
      location: 'Cedar Park, TX',
      address: '9012 Tech Ridge Pkwy, Cedar Park, TX 78613',
      distanceFromUser: 12.7,
      phone: '(512) 555-0789',
      email: 'sales@eliteappliance.com',
      website: 'eliteappliance.com',
      hours: {
        monday: '9:00 AM - 7:00 PM',
        tuesday: '9:00 AM - 7:00 PM',
        wednesday: '9:00 AM - 7:00 PM',
        thursday: '9:00 AM - 7:00 PM',
        friday: '9:00 AM - 8:00 PM',
        saturday: '9:00 AM - 8:00 PM',
        sunday: '11:00 AM - 6:00 PM'
      },
      isOpen: false,
      specialOffers: ['Free installation on select models', '90 days same as cash'],
      memberDiscount: 8,
      tags: ['Appliances', 'Installation', 'Warranty', 'Energy Efficient'],
      images: ['showroom.jpg', 'appliances.jpg'],
      isVerified: true,
      isPartner: false,
      savvySaverDeals: 3,
      establishedYear: 2001,
      acceptedPayments: ['Credit Cards', 'Financing', 'HomeHub Credits']
    },
    {
      id: '4',
      name: 'Flooring Unlimited',
      category: 'Flooring',
      subcategory: 'Carpet, Hardwood & Tile',
      description: 'Complete flooring solutions from selection to professional installation.',
      rating: 4.9,
      reviewCount: 89,
      location: 'Georgetown, TX',
      address: '3456 Commerce St, Georgetown, TX 78626',
      distanceFromUser: 15.2,
      phone: '(512) 555-0321',
      email: 'info@flooringunlimited.com',
      website: 'flooringunlimited.com',
      hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: 'Closed'
      },
      isOpen: true,
      specialOffers: ['Free in-home consultation', '10 year installation warranty'],
      memberDiscount: 20,
      tags: ['Hardwood', 'Tile', 'Carpet', 'Luxury Vinyl'],
      images: ['showroom-floor.jpg', 'samples.jpg'],
      isVerified: true,
      isPartner: true,
      savvySaverDeals: 12,
      establishedYear: 1992,
      acceptedPayments: ['Credit Cards', 'HomeHub Credits', 'Cash', 'Check']
    },
    {
      id: '5',
      name: 'Security Solutions Plus',
      category: 'Security & Safety',
      subcategory: 'Home Security Systems',
      description: 'Professional home security system installation and monitoring services.',
      rating: 4.5,
      reviewCount: 278,
      location: 'Austin, TX',
      address: '7890 Security Blvd, Austin, TX 78750',
      distanceFromUser: 6.8,
      phone: '(512) 555-0654',
      email: 'contact@securityplus.com',
      website: 'securitysolutionsplus.com',
      hours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      isOpen: true,
      specialOffers: ['Free security assessment', 'First month monitoring free'],
      memberDiscount: 10,
      tags: ['Security Cameras', 'Alarms', 'Smart Locks', 'Monitoring'],
      images: ['security-demo.jpg', 'equipment.jpg'],
      isVerified: true,
      isPartner: true,
      savvySaverDeals: 6,
      establishedYear: 2008,
      acceptedPayments: ['Credit Cards', 'Monthly Billing', 'HomeHub Credits']
    }
  ]);

  const categories = ['All', 'Home Improvement', 'Garden Center', 'Appliances', 'Flooring', 'Security & Safety', 'Plumbing', 'Electrical'];
  const locations = ['All', 'Austin, TX', 'Round Rock, TX', 'Cedar Park, TX', 'Georgetown, TX'];
  const openStatuses = ['All', 'Open Now', 'Closed'];

  const filterAndSortMerchants = () => {
    let filtered = merchants.filter(merchant => {
      const matchesSearch = searchQuery === '' || 
        merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesCategory = categoryFilter === 'all' || merchant.category === categoryFilter;
      const matchesLocation = locationFilter === 'all' || merchant.location === locationFilter;
      const matchesOpen = openFilter === 'all' || 
        (openFilter === 'open now' && merchant.isOpen) ||
        (openFilter === 'closed' && !merchant.isOpen);
        
      return matchesSearch && matchesCategory && matchesLocation && matchesOpen;
    });

    // Sort merchants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return a.distanceFromUser - b.distanceFromUser;
        case 'discount':
          return (b.memberDiscount || 0) - (a.memberDiscount || 0);
        case 'deals':
          return b.savvySaverDeals - a.savvySaverDeals;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredMerchants = filterAndSortMerchants();

  const openMerchants = merchants.filter(m => m.isOpen).length;
  const partnerMerchants = merchants.filter(m => m.isPartner).length;
  const averageDiscount = merchants
    .filter(m => m.memberDiscount)
    .reduce((sum, m) => sum + (m.memberDiscount || 0), 0) / merchants.filter(m => m.memberDiscount).length;
  const totalDeals = merchants.reduce((sum, m) => sum + m.savvySaverDeals, 0);

  const viewDetails = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setIsDetailsOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Merchants
          </h1>
          <p className="text-muted-foreground">Discover local businesses and partners with exclusive member benefits</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Merchants</p>
                <p className="text-2xl font-semibold">{merchants.length}</p>
              </div>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Now</p>
                <p className="text-2xl font-semibold text-green-600">{openMerchants}</p>
              </div>
              <Clock className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partners</p>
                <p className="text-2xl font-semibold text-blue-600">{partnerMerchants}</p>
              </div>
              <Award className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-semibold text-purple-600">{totalDeals}</p>
              </div>
              <Percent className="h-5 w-5 text-purple-600" />
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
            
            <Select value={openFilter} onValueChange={setOpenFilter}>
              <SelectTrigger data-testid="select-open-filter">
                <SelectValue placeholder="Hours" />
              </SelectTrigger>
              <SelectContent>
                {openStatuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {status}
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
                <SelectItem value="discount">Best Discount</SelectItem>
                <SelectItem value="deals">Most Deals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMerchants.map((merchant) => (
          <Card key={merchant.id} className="hover-elevate cursor-pointer" onClick={() => viewDetails(merchant)}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={merchant.profileImage} alt={merchant.name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {merchant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {merchant.isPartner && (
                    <Award className="absolute -top-1 -right-1 h-5 w-5 text-blue-600 bg-white rounded-full p-0.5" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{merchant.name}</h3>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${merchant.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-muted-foreground">
                            {merchant.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{merchant.subcategory}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{merchant.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({merchant.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {merchant.memberDiscount && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {merchant.memberDiscount}% off
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {merchant.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{merchant.distanceFromUser} mi away</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span>{merchant.savvySaverDeals} deals</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{merchant.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Since {merchant.establishedYear}</span>
                    </div>
                  </div>
                  
                  {merchant.specialOffers.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-purple-600">Special Offers:</p>
                      {merchant.specialOffers.slice(0, 2).map((offer, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {offer}</p>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 pt-2">
                    {merchant.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMerchants.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No merchants found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search filters or exploring different categories
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setLocationFilter('all');
                setOpenFilter('all');
              }}
              data-testid="button-clear-filters"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Merchant Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Merchant Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMerchant && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedMerchant.profileImage} />
                  <AvatarFallback className="text-xl">
                    {selectedMerchant.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">{selectedMerchant.name}</h2>
                    {selectedMerchant.isPartner && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Partner
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${selectedMerchant.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-muted-foreground">
                        {selectedMerchant.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{selectedMerchant.subcategory}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedMerchant.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({selectedMerchant.reviewCount})
                      </span>
                    </div>
                    {selectedMerchant.memberDiscount && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {selectedMerchant.memberDiscount}% Member Discount
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-sm">{selectedMerchant.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{selectedMerchant.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{selectedMerchant.email}</span>
                    </div>
                    {selectedMerchant.website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" />
                        <a 
                          href={`https://${selectedMerchant.website}`}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {selectedMerchant.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Hours</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Monday:</span>
                      <span>{selectedMerchant.hours.monday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tuesday:</span>
                      <span>{selectedMerchant.hours.tuesday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wednesday:</span>
                      <span>{selectedMerchant.hours.wednesday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thursday:</span>
                      <span>{selectedMerchant.hours.thursday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Friday:</span>
                      <span>{selectedMerchant.hours.friday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span>{selectedMerchant.hours.saturday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span>{selectedMerchant.hours.sunday}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedMerchant.specialOffers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Special Offers</h3>
                  <ul className="space-y-1">
                    {selectedMerchant.specialOffers.map((offer, index) => (
                      <li key={index} className="text-sm">• {offer}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-2">Services & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMerchant.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Payment Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMerchant.acceptedPayments.map((payment) => (
                    <Badge key={payment} variant="outline" className="text-xs">
                      {payment}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button variant="outline" data-testid="button-add-favorite">
              <Heart className="h-3 w-3 mr-1" />
              Favorite
            </Button>
            <Button variant="outline" data-testid="button-share-merchant">
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
            <Button data-testid="button-visit-merchant">
              <ShoppingBag className="h-3 w-3 mr-1" />
              Visit Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}