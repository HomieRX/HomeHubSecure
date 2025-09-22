import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Shield, 
  Plus, 
  Calendar,
  Clock, 
  CheckCircle,
  AlertTriangle,
  Package,
  DollarSign,
  Star,
  Search
} from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface MaintenanceBundle {
  id: string;
  name: string;
  description: string;
  services: string[];
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  price: number;
  isActive: boolean;
  nextScheduled?: Date;
  lastCompleted?: Date;
  completionRate: number;
}

interface MaintenanceTask {
  id: string;
  bundleId: string;
  title: string;
  description: string;
  status: 'pending' | 'scheduled' | 'completed' | 'overdue';
  dueDate: Date;
  completedDate?: Date;
  contractor?: string;
  cost?: number;
  priority: 'low' | 'medium' | 'high';
}

export default function Maintenance() {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateBundleOpen, setIsCreateBundleOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [maintenanceBundles, setMaintenanceBundles] = useState<MaintenanceBundle[]>([
  ]);

  // Fetch maintenance items from server
  const { data: fetchedItems } = useQuery({
    queryKey: ['/api/maintenance-items'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/maintenance-items');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // Map fetched maintenance items to simple bundles for display when available
  const itemsToDisplay = (fetchedItems || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    services: item.instructions ? [item.instructions.substring(0, 120)] : [],
    frequency: 'biannual' as const,
    price: 0,
    isActive: item.isActive ?? true,
    nextScheduled: undefined,
    lastCompleted: undefined,
    completionRate: 0
  })) as MaintenanceBundle[];

  const bundlesSource = itemsToDisplay.length > 0 ? itemsToDisplay : maintenanceBundles;

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      bundleId: '1',
      title: 'Replace HVAC Filter',
      description: 'Change air filter in main HVAC unit',
      status: 'scheduled',
      dueDate: new Date(2025, 8, 20),
      priority: 'medium',
      contractor: 'Sarah Davis - Cool Air Solutions',
      cost: 35
    },
    {
      id: '2',
      bundleId: '1',
      title: 'Clean Gutters',
      description: 'Remove debris and check for proper drainage',
      status: 'pending',
      dueDate: new Date(2025, 8, 25),
      priority: 'medium'
    },
    {
      id: '3',
      bundleId: '2',
      title: 'Annual HVAC Service',
      description: 'Complete system inspection and tune-up',
      status: 'overdue',
      dueDate: new Date(2025, 8, 1),
      priority: 'high',
      contractor: 'Mike Johnson - HVAC Pro'
    },
    {
      id: '4',
      bundleId: '1',
      title: 'Test Smoke Detectors',
      description: 'Test all smoke detectors and replace batteries if needed',
      status: 'completed',
      dueDate: new Date(2025, 7, 15),
      completedDate: new Date(2025, 7, 16),
      priority: 'high',
      cost: 15
    }
  ]);

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'biannual': return 'Twice Yearly';
      case 'annual': return 'Annually';
      default: return frequency;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const activeBundles = maintenanceBundles.filter(bundle => bundle.isActive);
  const upcomingTasks = maintenanceTasks.filter(task => 
    task.status === 'scheduled' || task.status === 'pending' || task.status === 'overdue'
  ).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const stats = {
    activeBundles: activeBundles.length,
    upcomingTasks: upcomingTasks.length,
    overdueTasks: maintenanceTasks.filter(t => t.status === 'overdue').length,
    completedThisMonth: maintenanceTasks.filter(t => 
      t.status === 'completed' && 
      t.completedDate &&
      t.completedDate.getMonth() === new Date().getMonth()
    ).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Maintenance - PreventiT!
          </h1>
          <p className="text-muted-foreground">Bundle builder dashboard for preventive home maintenance</p>
        </div>
        
        <Dialog open={isCreateBundleOpen} onOpenChange={setIsCreateBundleOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-bundle">
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Bundle</DialogTitle>
              <DialogDescription>
                Build a custom maintenance package tailored to your home's needs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Bundle Name</label>
                <Input placeholder="e.g., Winter Preparation" data-testid="input-bundle-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select>
                  <SelectTrigger data-testid="select-bundle-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="biannual">Twice Yearly</SelectItem>
                    <SelectItem value="annual">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="button-save-bundle">Create Bundle</Button>
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
                <p className="text-sm text-muted-foreground">Active Bundles</p>
                <p className="text-2xl font-semibold">{stats.activeBundles}</p>
              </div>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Tasks</p>
                <p className="text-2xl font-semibold">{stats.upcomingTasks}</p>
              </div>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{stats.overdueTasks}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{stats.completedThisMonth}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bundles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bundles" data-testid="tab-bundles">Maintenance Bundles</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Upcoming Tasks</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="bundles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bundlesSource.map((bundle) => (
              <Card key={bundle.id} className={`hover-elevate cursor-pointer ${bundle.isActive ? 'ring-1 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {bundle.name}
                        {bundle.isActive && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">${bundle.price}</div>
                      <div className="text-xs text-muted-foreground">{getFrequencyLabel(bundle.frequency)}</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Included Services:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {bundle.services.map((service, index) => (
                          <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {service}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {bundle.isActive && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Completion Rate</span>
                          <span className="font-medium">{bundle.completionRate}%</span>
                        </div>
                        <Progress value={bundle.completionRate} className="h-2" />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Last: {bundle.lastCompleted ? format(bundle.lastCompleted, 'MMM d') : 'Never'}
                          </span>
                          <span>
                            Next: {bundle.nextScheduled ? format(bundle.nextScheduled, 'MMM d') : 'Not scheduled'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {bundle.isActive ? (
                        <>
                          <Button size="sm" variant="outline" data-testid={`button-view-bundle-${bundle.id}`}>
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-edit-bundle-${bundle.id}`}>
                            Edit Bundle
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" data-testid={`button-activate-bundle-${bundle.id}`}>
                          Activate Bundle
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <CardTitle>Upcoming Maintenance Tasks</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Due: {format(task.dueDate, 'MMM d, yyyy')}</span>
                        {task.contractor && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {task.contractor}
                          </span>
                        )}
                        {task.cost && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${task.cost}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-reschedule-${task.id}`}>
                        Reschedule
                      </Button>
                      {task.status === 'pending' && (
                        <Button size="sm" data-testid={`button-schedule-${task.id}`}>
                          Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search maintenance history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-history"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceTasks
                  .filter(task => task.status === 'completed')
                  .map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed: {task.completedDate ? format(task.completedDate, 'MMM d, yyyy') : 'Unknown'}
                        </p>
                      </div>
                      {task.cost && (
                        <div className="text-right">
                          <div className="font-medium">${task.cost}</div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}