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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Calendar,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Home
} from 'lucide-react';
import { format } from 'date-fns';

interface Inspection {
  id: string;
  type: string;
  description: string;
  status: 'scheduled' | 'completed' | 'pending' | 'cancelled';
  date: Date;
  inspector: string;
  inspectorRating?: number;
  location: string;
  cost?: number;
  reportUrl?: string;
  findings?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  nextRecommended?: Date;
}

export default function Inspections() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [inspections, setInspections] = useState<Inspection[]>([
    {
      id: '1',
      type: 'Home Inspection',
      description: 'Comprehensive annual home inspection',
      status: 'completed',
      date: new Date(2025, 7, 15),
      inspector: 'Robert Chen - Certified Home Inspector',
      inspectorRating: 4.9,
      location: 'Whole House',
      cost: 450,
      reportUrl: '/reports/home-inspection-2025-08-15.pdf',
      findings: ['Minor roof wear', 'HVAC filter needs replacement', 'Electrical panel in good condition'],
      priority: 'medium',
      nextRecommended: new Date(2026, 7, 15)
    },
    {
      id: '2',
      type: 'HVAC Inspection',
      description: 'Pre-season HVAC system inspection and maintenance',
      status: 'scheduled',
      date: new Date(2025, 8, 20),
      inspector: 'Sarah Davis - HVAC Specialist',
      inspectorRating: 4.8,
      location: 'HVAC System',
      cost: 125,
      priority: 'high',
    },
    {
      id: '3',
      type: 'Electrical Safety',
      description: 'Electrical system safety inspection',
      status: 'completed',
      date: new Date(2025, 6, 10),
      inspector: 'Mike Rodriguez - Licensed Electrician',
      inspectorRating: 4.7,
      location: 'Electrical Panel & Outlets',
      cost: 200,
      reportUrl: '/reports/electrical-inspection-2025-07-10.pdf',
      findings: ['All circuits functioning properly', 'GFCI outlets tested OK', 'Recommend upgrading main panel within 5 years'],
      priority: 'medium',
      nextRecommended: new Date(2026, 6, 10)
    },
    {
      id: '4',
      type: 'Plumbing Inspection',
      description: 'Annual plumbing system inspection',
      status: 'pending',
      date: new Date(2025, 8, 25),
      inspector: 'Plumbing Pro Services',
      location: 'Whole House Plumbing',
      priority: 'medium'
    },
    {
      id: '5',
      type: 'Roof Inspection',
      description: 'Post-storm roof damage assessment',
      status: 'completed',
      date: new Date(2025, 8, 5),
      inspector: 'Tom Wilson - Roofing Specialist',
      inspectorRating: 4.6,
      location: 'Exterior Roof',
      cost: 175,
      reportUrl: '/reports/roof-inspection-2025-09-05.pdf',
      findings: ['3 loose shingles replaced', 'Gutters need cleaning', 'Overall roof condition: Good'],
      priority: 'high',
      nextRecommended: new Date(2026, 8, 5)
    }
  ]);

  const inspectionTypes = ['All', 'Home Inspection', 'HVAC Inspection', 'Electrical Safety', 'Plumbing Inspection', 'Roof Inspection'];
  const statuses = ['All', 'Scheduled', 'Completed', 'Pending', 'Cancelled'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
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
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = searchQuery === '' || 
      inspection.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.inspector.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || inspection.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const recentInspections = inspections
    .filter(inspection => inspection.status === 'completed')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const upcomingInspections = inspections
    .filter(inspection => inspection.status === 'scheduled' || inspection.status === 'pending')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const stats = {
    total: inspections.length,
    completed: inspections.filter(i => i.status === 'completed').length,
    scheduled: inspections.filter(i => i.status === 'scheduled').length,
    pending: inspections.filter(i => i.status === 'pending').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Inspections - CheckiT!
          </h1>
          <p className="text-muted-foreground">Dashboard with recent inspection reports and PDF downloads</p>
        </div>
        
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-schedule-inspection">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Inspection</DialogTitle>
              <DialogDescription>
                Book a professional inspection service for your home.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Inspection Type</label>
                <Select>
                  <SelectTrigger data-testid="select-inspection-type">
                    <SelectValue placeholder="Select inspection type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectionTypes.filter(type => type !== 'All').map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Preferred Date</label>
                <Input type="date" data-testid="input-inspection-date" />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select>
                  <SelectTrigger data-testid="select-inspection-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="button-confirm-schedule">Schedule Inspection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
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
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.scheduled}</p>
              </div>
              <Calendar className="h-5 w-5 text-blue-600" />
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
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="recents" data-testid="tab-recents">Recent Reports</TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Inspections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(inspection.status)}
                          <span className="font-medium text-sm">{inspection.type}</span>
                          <Badge className={getPriorityColor(inspection.priority)}>
                            {inspection.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(inspection.date, 'MMM d, yyyy')} • {inspection.location}
                        </p>
                        {inspection.inspectorRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{inspection.inspectorRating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" data-testid={`button-view-${inspection.id}`}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {inspection.reportUrl && (
                          <Button size="sm" variant="outline" data-testid={`button-download-${inspection.id}`}>
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Inspections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(inspection.status)}
                          <span className="font-medium text-sm">{inspection.type}</span>
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(inspection.date, 'MMM d, yyyy')} • {inspection.location}
                        </p>
                        {inspection.inspector && (
                          <p className="text-xs text-muted-foreground">{inspection.inspector}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" data-testid={`button-reschedule-${inspection.id}`}>
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspection Reports</CardTitle>
              <p className="text-sm text-muted-foreground">Download and view completed inspection reports</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell>{format(inspection.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{inspection.type}</TableCell>
                      <TableCell>{inspection.inspector}</TableCell>
                      <TableCell>
                        {inspection.inspectorRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{inspection.inspectorRating}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{inspection.location}</TableCell>
                      <TableCell>{inspection.cost ? `$${inspection.cost}` : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" data-testid={`button-view-report-${inspection.id}`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {inspection.reportUrl && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              data-testid={`button-download-pdf-${inspection.id}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingInspections.map((inspection) => (
                  <div key={inspection.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{inspection.type}</h3>
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status}
                          </Badge>
                          <Badge className={getPriorityColor(inspection.priority)}>
                            {inspection.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{inspection.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(inspection.date, 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {inspection.location}
                          </span>
                          {inspection.cost && (
                            <span>${inspection.cost}</span>
                          )}
                        </div>
                        {inspection.inspector && (
                          <p className="text-sm">Inspector: {inspection.inspector}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`button-reschedule-inspection-${inspection.id}`}>
                          Reschedule
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-cancel-${inspection.id}`}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inspections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-inspections"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status.toLowerCase()}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectionTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium">{inspection.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(inspection.status)}
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{format(inspection.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{inspection.inspector}</TableCell>
                      <TableCell>{inspection.location}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(inspection.priority)}>
                          {inspection.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{inspection.cost ? `$${inspection.cost}` : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" data-testid={`button-view-all-${inspection.id}`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {inspection.reportUrl && (
                            <Button size="sm" variant="outline" data-testid={`button-download-all-${inspection.id}`}>
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}