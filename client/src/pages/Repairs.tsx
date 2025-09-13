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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Wrench, 
  Plus, 
  Filter, 
  Search, 
  Clock,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  requestedDate: Date;
  scheduledDate?: Date;
  estimatedCost?: number;
  assignedContractor?: string;
  images?: string[];
}

export default function Repairs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([
    {
      id: '1',
      title: 'Kitchen Sink Leak',
      description: 'Water dripping from under the kitchen sink. Appears to be coming from the pipe connection.',
      category: 'Plumbing',
      priority: 'high',
      status: 'scheduled',
      location: 'Kitchen',
      requestedDate: new Date(2025, 8, 10),
      scheduledDate: new Date(2025, 8, 15, 14, 0),
      estimatedCost: 150,
      assignedContractor: 'Mike Johnson - Plumbing Pro'
    },
    {
      id: '2',
      title: 'HVAC Not Cooling',
      description: 'Air conditioning system not providing cold air. Unit runs but air feels warm.',
      category: 'HVAC',
      priority: 'high',
      status: 'in-progress',
      location: 'Whole House',
      requestedDate: new Date(2025, 8, 8),
      scheduledDate: new Date(2025, 8, 12, 9, 0),
      estimatedCost: 275,
      assignedContractor: 'Sarah Davis - Cool Air Solutions'
    },
    {
      id: '3',
      title: 'Garage Door Won\'t Open',
      description: 'Garage door opener making noise but door not moving. Remote and wall button both not working.',
      category: 'Garage Door',
      priority: 'medium',
      status: 'completed',
      location: 'Garage',
      requestedDate: new Date(2025, 8, 5),
      scheduledDate: new Date(2025, 8, 7, 16, 0),
      estimatedCost: 120,
      assignedContractor: 'Tom Wilson - Door Masters'
    },
    {
      id: '4',
      title: 'Electrical Outlet Not Working',
      description: 'Bathroom GFCI outlet has no power. Reset button doesn\'t help.',
      category: 'Electrical',
      priority: 'medium',
      status: 'pending',
      location: 'Master Bathroom',
      requestedDate: new Date(2025, 8, 13),
    }
  ]);

  const categories = ['All', 'Plumbing', 'HVAC', 'Electrical', 'Garage Door', 'Appliance', 'General'];
  const statuses = ['All', 'Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredRequests = repairRequests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter.toLowerCase().replace(' ', '-');
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: repairRequests.length,
    pending: repairRequests.filter(r => r.status === 'pending').length,
    scheduled: repairRequests.filter(r => r.status === 'scheduled').length,
    inProgress: repairRequests.filter(r => r.status === 'in-progress').length,
    completed: repairRequests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Repairs - FixiT!
          </h1>
          <p className="text-muted-foreground">Manage your home repair requests and track progress</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-repair">
              <Plus className="h-4 w-4 mr-2" />
              Request Repair
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request New Repair</DialogTitle>
              <DialogDescription>
                Describe your repair need and we'll connect you with qualified contractors.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Issue Title</label>
                <Input placeholder="Brief description of the problem" data-testid="input-repair-title" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select>
                  <SelectTrigger data-testid="select-repair-category">
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
                  <SelectTrigger data-testid="select-repair-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="button-submit-repair">Submit Request</Button>
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
              <Wrench className="h-5 w-5 text-muted-foreground" />
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
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.scheduled}</p>
              </div>
              <Calendar className="h-5 w-5 text-purple-600" />
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-repairs"
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
              <SelectTrigger className="w-full md:w-40" data-testid="select-category-filter">
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

      {/* Repair Requests */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover-elevate cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{request.title}</h3>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{request.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {request.location}
                    </span>
                    <span>{request.category}</span>
                    <span>Requested: {format(request.requestedDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  {request.estimatedCost && (
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3" />
                      <span>${request.estimatedCost}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {request.scheduledDate && (
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      Scheduled: {format(request.scheduledDate, 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {request.assignedContractor && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{request.assignedContractor}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" data-testid={`button-view-details-${request.id}`}>
                  View Details
                </Button>
                {request.status === 'pending' && (
                  <Button variant="outline" size="sm" data-testid={`button-edit-${request.id}`}>
                    Edit Request
                  </Button>
                )}
                {request.status === 'completed' && (
                  <Button size="sm" data-testid={`button-review-${request.id}`}>
                    Leave Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No repair requests found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Create your first repair request to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-repair">
                <Plus className="h-4 w-4 mr-2" />
                Request Repair
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}