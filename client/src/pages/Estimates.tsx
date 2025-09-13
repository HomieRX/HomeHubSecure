import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  FileText, 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  MessageSquare,
  Download,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';

interface EstimateRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestDate: Date;
  responseDeadline: Date;
  location: string;
  preferredStartDate?: Date;
  budget?: {
    min: number;
    max: number;
  };
  quotes: EstimateQuote[];
  attachments: string[];
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
}

interface EstimateQuote {
  id: string;
  contractorId: string;
  contractorName: string;
  contractorCompany: string;
  contractorRating: number;
  amount: number;
  breakdown: {
    labor: number;
    materials: number;
    permits?: number;
    other?: number;
  };
  timeline: {
    startDate: Date;
    completionDate: Date;
    duration: string;
  };
  warranty: string;
  notes?: string;
  submittedAt: Date;
  validUntil: Date;
  isAccepted?: boolean;
}

export default function Estimates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EstimateRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [estimateRequests, setEstimateRequests] = useState<EstimateRequest[]>([
    {
      id: '1',
      title: 'Kitchen Renovation',
      description: 'Complete kitchen remodel including new cabinets, countertops, appliances, and flooring.',
      category: 'Kitchen Remodeling',
      status: 'quoted',
      priority: 'medium',
      requestDate: new Date(2025, 8, 1),
      responseDeadline: new Date(2025, 8, 15),
      location: 'Austin, TX',
      preferredStartDate: new Date(2025, 9, 1),
      budget: { min: 15000, max: 25000 },
      quotes: [
        {
          id: 'q1',
          contractorId: '1',
          contractorName: 'Mike Johnson',
          contractorCompany: 'Johnson Construction',
          contractorRating: 4.8,
          amount: 22500,
          breakdown: { labor: 12000, materials: 9500, permits: 1000 },
          timeline: {
            startDate: new Date(2025, 8, 20),
            completionDate: new Date(2025, 9, 25),
            duration: '5-6 weeks'
          },
          warranty: '2 years on workmanship, manufacturer warranty on materials',
          submittedAt: new Date(2025, 8, 5),
          validUntil: new Date(2025, 8, 20)
        },
        {
          id: 'q2',
          contractorId: '2',
          contractorName: 'Sarah Davis',
          contractorCompany: 'Elite Kitchen Designs',
          contractorRating: 4.9,
          amount: 28000,
          breakdown: { labor: 15000, materials: 12000, permits: 1000 },
          timeline: {
            startDate: new Date(2025, 8, 25),
            completionDate: new Date(2025, 10, 1),
            duration: '6-7 weeks'
          },
          warranty: '3 years on workmanship, extended warranty available',
          submittedAt: new Date(2025, 8, 7),
          validUntil: new Date(2025, 8, 22)
        }
      ],
      attachments: ['kitchen-photos.pdf', 'floor-plan.jpg'],
      contactInfo: {
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john.smith@email.com'
      }
    },
    {
      id: '2',
      title: 'HVAC System Replacement',
      description: 'Replace aging HVAC system with new energy-efficient unit for 2,400 sq ft home.',
      category: 'HVAC',
      status: 'in-progress',
      priority: 'high',
      requestDate: new Date(2025, 7, 20),
      responseDeadline: new Date(2025, 8, 5),
      location: 'Austin, TX',
      preferredStartDate: new Date(2025, 8, 15),
      budget: { min: 8000, max: 12000 },
      quotes: [
        {
          id: 'q3',
          contractorId: '3',
          contractorName: 'Robert Chen',
          contractorCompany: 'Cool Air Solutions',
          contractorRating: 4.7,
          amount: 9800,
          breakdown: { labor: 3500, materials: 6300 },
          timeline: {
            startDate: new Date(2025, 8, 18),
            completionDate: new Date(2025, 8, 20),
            duration: '2-3 days'
          },
          warranty: '10 years on unit, 5 years on installation',
          submittedAt: new Date(2025, 8, 2),
          validUntil: new Date(2025, 8, 17),
          isAccepted: true
        }
      ],
      attachments: ['current-system-photos.jpg'],
      contactInfo: {
        name: 'Jane Smith',
        phone: '(555) 234-5678',
        email: 'jane.smith@email.com'
      }
    },
    {
      id: '3',
      title: 'Bathroom Renovation',
      description: 'Master bathroom remodel with new tile, vanity, and fixtures.',
      category: 'Bathroom Remodeling',
      status: 'pending',
      priority: 'medium',
      requestDate: new Date(2025, 8, 10),
      responseDeadline: new Date(2025, 8, 25),
      location: 'Round Rock, TX',
      budget: { min: 8000, max: 15000 },
      quotes: [],
      attachments: ['bathroom-inspiration.pdf'],
      contactInfo: {
        name: 'Bob Wilson',
        phone: '(555) 345-6789',
        email: 'bob.wilson@email.com'
      }
    },
    {
      id: '4',
      title: 'Roof Repair',
      description: 'Fix leak in roof after recent storm damage, replace damaged shingles.',
      category: 'Roofing',
      status: 'completed',
      priority: 'urgent',
      requestDate: new Date(2025, 7, 28),
      responseDeadline: new Date(2025, 8, 2),
      location: 'Cedar Park, TX',
      budget: { min: 2000, max: 5000 },
      quotes: [
        {
          id: 'q4',
          contractorId: '4',
          contractorName: 'Tom Martinez',
          contractorCompany: 'Apex Roofing',
          contractorRating: 4.6,
          amount: 3200,
          breakdown: { labor: 1500, materials: 1700 },
          timeline: {
            startDate: new Date(2025, 8, 3),
            completionDate: new Date(2025, 8, 4),
            duration: '1-2 days'
          },
          warranty: '5 years on workmanship',
          submittedAt: new Date(2025, 7, 30),
          validUntil: new Date(2025, 8, 15),
          isAccepted: true
        }
      ],
      attachments: ['storm-damage-photos.jpg'],
      contactInfo: {
        name: 'Alice Johnson',
        phone: '(555) 456-7890',
        email: 'alice.johnson@email.com'
      }
    }
  ]);

  const categories = ['All', 'Kitchen Remodeling', 'Bathroom Remodeling', 'HVAC', 'Roofing', 'Electrical', 'Plumbing'];
  const statuses = ['All', 'Pending', 'Quoted', 'Accepted', 'In Progress', 'Completed', 'Rejected', 'Expired'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quoted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'quoted':
      case 'accepted':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredRequests = estimateRequests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || 
      request.status === statusFilter.toLowerCase().replace(' ', '-');
      
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: estimateRequests.length,
    pending: estimateRequests.filter(r => r.status === 'pending').length,
    quoted: estimateRequests.filter(r => r.status === 'quoted').length,
    inProgress: estimateRequests.filter(r => r.status === 'in-progress').length,
    completed: estimateRequests.filter(r => r.status === 'completed').length,
  };

  const viewDetails = (request: EstimateRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Estimates - HandleiT!
          </h1>
          <p className="text-muted-foreground">Dashboard for tracking estimate requests, quotes, and project status</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-estimate">
              <Plus className="h-4 w-4 mr-2" />
              Request Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request New Estimate</DialogTitle>
              <DialogDescription>
                Describe your project and get quotes from qualified contractors.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Title</label>
                <Input placeholder="Brief description of your project" data-testid="input-project-title" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select>
                  <SelectTrigger data-testid="select-project-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat !== 'All').map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select>
                  <SelectTrigger data-testid="select-project-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="button-submit-estimate">Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quoted</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.quoted}</p>
              </div>
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">Active Projects</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search estimates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-estimates"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status.toLowerCase().replace(' ', '-')}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
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
              </div>
            </CardContent>
          </Card>

          {/* Estimates Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Quotes</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-48">
                            {request.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{request.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.quotes.length}</TableCell>
                      <TableCell>
                        {request.budget ? 
                          `$${request.budget.min.toLocaleString()}-$${request.budget.max.toLocaleString()}` 
                          : '-'}
                      </TableCell>
                      <TableCell>{format(request.responseDeadline, 'MMM d')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => viewDetails(request)}
                            data-testid={`button-view-${request.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-edit-${request.id}`}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests
              .filter(r => ['in-progress', 'quoted', 'accepted'].includes(r.status))
              .map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{request.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{request.description}</p>
                    
                    {request.quotes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Quotes Received:</h4>
                        {request.quotes.map((quote) => (
                          <div key={quote.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{quote.contractorName}</p>
                                <p className="text-sm text-muted-foreground">{quote.contractorCompany}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${quote.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{quote.timeline.duration}</p>
                              </div>
                            </div>
                            {quote.isAccepted && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-2">
                                Accepted
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => viewDetails(request)}
                        data-testid={`button-view-active-${request.id}`}
                      >
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-message-${request.id}`}>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estimateRequests
                  .filter(r => ['completed', 'rejected', 'expired'].includes(r.status))
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <h3 className="font-medium">{request.title}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.category} • {format(request.requestDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewDetails(request)}
                          data-testid={`button-view-history-${request.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-download-${request.id}`}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estimate Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">{selectedRequest.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRequest.category}</p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>
              
              {selectedRequest.budget && (
                <div>
                  <h4 className="font-medium mb-2">Budget Range</h4>
                  <p className="text-sm">
                    ${selectedRequest.budget.min.toLocaleString()} - ${selectedRequest.budget.max.toLocaleString()}
                  </p>
                </div>
              )}
              
              {selectedRequest.quotes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Quotes ({selectedRequest.quotes.length})</h4>
                  <div className="space-y-3">
                    {selectedRequest.quotes.map((quote) => (
                      <div key={quote.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{quote.contractorName}</p>
                            <p className="text-sm text-muted-foreground">{quote.contractorCompany}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">${quote.amount.toLocaleString()}</p>
                            {quote.isAccepted && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Accepted
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Breakdown:</p>
                            <p>Labor: ${quote.breakdown.labor.toLocaleString()}</p>
                            <p>Materials: ${quote.breakdown.materials.toLocaleString()}</p>
                            {quote.breakdown.permits && (
                              <p>Permits: ${quote.breakdown.permits.toLocaleString()}</p>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Timeline:</p>
                            <p>Start: {format(quote.timeline.startDate, 'MMM d, yyyy')}</p>
                            <p>Duration: {quote.timeline.duration}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Warranty:</p>
                          <p>{quote.warranty}</p>
                        </div>
                        
                        {quote.notes && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Notes:</p>
                            <p>{quote.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button data-testid="button-contact-contractor">Contact Contractor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}