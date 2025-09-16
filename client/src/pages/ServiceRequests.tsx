import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Wrench,
  Shield,
  Users,
  Star,
  ArrowRight,
  Edit3,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ServiceRequest, 
  ServiceRequestStatus, 
  ServiceType, 
  AuthUserResponse,
  MemberProfile
} from "@shared/types";
import { format } from "date-fns";

type FilterTab = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

// Service type mapping to icons  
const serviceIcons: Record<ServiceType, any> = {
  FixiT: Wrench,
  PreventiT: Shield,
  HandleiT: Users,
  CheckiT: Search,
  LoyalizeiT: Star
};

export default function ServiceRequests() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch authenticated user
  const { data: currentUser, isLoading: loadingAuth, error: authError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch member profile for authenticated user
  const { data: memberProfile, isLoading: loadingMemberProfile } = useQuery<MemberProfile>({
    queryKey: ["/api/members/by-user", (currentUser as any)?.id || 'no-user'],
    enabled: !!(currentUser as any)?.id,
    retry: false,
  });

  // Fetch service requests for current member
  const { data: serviceRequests = [], isLoading: loadingRequests, error: requestsError, refetch } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/by-member", memberProfile?.id || 'no-member'],
    enabled: !!memberProfile?.id,
    retry: false,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: ServiceRequestStatus }) => {
      return apiRequest('PUT', `/api/service-requests/${requestId}`, { status });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Status Updated",
        description: `Service request status changed to ${variables.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/by-member", memberProfile?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getFilterCounts = () => {
    const counts = {
      all: serviceRequests.length,
      pending: serviceRequests.filter(req => req.status === 'pending').length,
      assigned: serviceRequests.filter(req => req.status === 'assigned').length,
      in_progress: serviceRequests.filter(req => req.status === 'in_progress').length,
      completed: serviceRequests.filter(req => req.status === 'completed').length,
      cancelled: serviceRequests.filter(req => req.status === 'cancelled').length,
    };
    return counts;
  };

  const filteredRequests = serviceRequests.filter(request => {
    const matchesFilter = activeFilter === 'all' || request.status === activeFilter;
    const matchesSearch = searchQuery === '' || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = getFilterCounts();

  const handleNewRequest = () => {
    navigate('/services');
  };

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusUpdate = (requestId: string, newStatus: ServiceRequestStatus) => {
    updateStatusMutation.mutate({ requestId, status: newStatus });
  };

  const getStatusBadge = (status: ServiceRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'assigned':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      case 'on_hold':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">On Hold</Badge>;
      case 'requires_approval':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Needs Approval</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">Emergency</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">High Priority</Badge>;
      case 'normal':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">Normal</Badge>;
      case 'low':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20 text-xs">Low Priority</Badge>;
      default:
        return null;
    }
  };

  // Handle authentication and loading states
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to view your service requests.</p>
        </div>
        <Button onClick={() => window.location.href = "/api/login"} data-testid="button-sign-in">
          Sign In
        </Button>
      </div>
    );
  }

  if (loadingAuth || loadingMemberProfile || loadingRequests) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">
            {loadingAuth && "Authenticating..."}
            {loadingMemberProfile && "Loading member profile..."}
            {loadingRequests && "Loading service requests..."}
          </div>
        </div>
      </div>
    );
  }

  if (requestsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Error Loading Requests</h3>
          <p className="text-muted-foreground">Unable to load your service requests. Please try again.</p>
        </div>
        <Button onClick={() => refetch()} data-testid="button-retry">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="page-title">
            Service Requests
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="page-description">
            Manage your HomeHub service requests and track progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleNewRequest} data-testid="button-new-request">
            <Plus className="h-4 w-4 mr-2" />
            Book Service
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-semibold text-foreground">
                  {counts.pending + counts.assigned + counts.in_progress}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{counts.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold text-foreground">{counts.all}</p>
              </div>
              <Wrench className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-semibold text-foreground">
                  {serviceRequests.filter(req => {
                    const requestDate = new Date(req.createdAt);
                    const now = new Date();
                    return requestDate.getMonth() === now.getMonth() && 
                           requestDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('all')}
            data-testid="filter-all"
          >
            All ({counts.all})
          </Button>
          <Button
            variant={activeFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('pending')}
            data-testid="filter-pending"
          >
            Pending ({counts.pending})
          </Button>
          <Button
            variant={activeFilter === 'assigned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('assigned')}
            data-testid="filter-assigned"
          >
            Assigned ({counts.assigned})
          </Button>
          <Button
            variant={activeFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('in_progress')}
            data-testid="filter-in-progress"
          >
            In Progress ({counts.in_progress})
          </Button>
          <Button
            variant={activeFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('completed')}
            data-testid="filter-completed"
          >
            Completed ({counts.completed})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Service Requests List */}
      <div className="space-y-4" data-testid="requests-list">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const ServiceIcon = serviceIcons[request.serviceType];
            
            return (
              <Card 
                key={request.id}
                className="hover-elevate cursor-pointer transition-all duration-200"
                onClick={() => setSelectedRequest(request)}
                data-testid={`service-request-${request.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <ServiceIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground" data-testid="request-title">
                            {request.title}
                          </h3>
                          {getStatusBadge(request.status)}
                          {getUrgencyBadge(request.urgency)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{request.serviceType}</span>
                            <span>•</span>
                            <span>{request.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span data-testid="request-created">
                              {format(new Date(request.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs mb-2" data-testid="request-id">
                        #{request.id.slice(-8)}
                      </Badge>
                      {request.estimatedCost && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span data-testid="request-cost">{Number(request.estimatedCost).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4" data-testid="request-description">
                    {request.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span data-testid="request-location">
                          {request.city}, {request.state}
                        </span>
                      </div>
                      {request.preferredDateTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span data-testid="request-preferred-date">
                            {format(new Date(request.preferredDateTime), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}
                      {request.pointsReward > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3" />
                          <span>{request.pointsReward} points</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(request.id, 'cancelled');
                          }}
                          data-testid="button-cancel-request"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                        }}
                        data-testid="button-view-details"
                      >
                        View Details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">No Service Requests</h3>
                <p className="text-muted-foreground mb-4">
                  {activeFilter === 'all' 
                    ? "You haven't created any service requests yet." 
                    : `No ${activeFilter.replace('_', ' ')} requests found.`}
                </p>
                <Button onClick={handleNewRequest} data-testid="button-book-first-service">
                  <Plus className="h-4 w-4 mr-2" />
                  Book Your First Service
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Request Detail Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Request Details</DialogTitle>
            <DialogDescription>
              Manage your service request #{selectedRequest?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {React.createElement(serviceIcons[selectedRequest.serviceType], { className: "h-8 w-8 text-primary" })}
                <div>
                  <h3 className="font-semibold text-lg">{selectedRequest.title}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                    {getUrgencyBadge(selectedRequest.urgency)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Service Type:</span>
                  <p className="font-medium">{selectedRequest.serviceType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{selectedRequest.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">{selectedRequest.city}, {selectedRequest.state}</p>
                </div>
                {selectedRequest.estimatedCost && (
                  <div>
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <p className="font-medium">${Number(selectedRequest.estimatedCost).toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Description:</span>
                <p className="text-sm mt-1">{selectedRequest.description}</p>
              </div>

              {selectedRequest.memberNotes && (
                <div>
                  <span className="text-muted-foreground text-sm">Your Notes:</span>
                  <p className="text-sm mt-1">{selectedRequest.memberNotes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </Button>
                {selectedRequest.status === 'pending' && (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, 'cancelled');
                      setSelectedRequest(null);
                    }}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}