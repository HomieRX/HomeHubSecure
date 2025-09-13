import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus } from 'lucide-react';
import ServiceRequestCard from '@/components/ServiceRequestCard';

type FilterTab = 'all' | 'pending' | 'in-progress' | 'completed';

export default function ServiceRequests() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // todo: remove mock data when backend is implemented
  const serviceRequests = [
    {
      id: 'SR-001',
      title: 'HVAC System Maintenance',
      description: 'Annual maintenance and filter replacement for central air system',
      contractor: 'Protech HVAC Services',
      date: '2024-01-15',
      location: 'Main Floor',
      price: '285.00',
      status: 'completed' as const,
      priority: 'medium' as const,
      category: 'HVAC'
    },
    {
      id: 'SR-002',
      title: 'Roof Inspection',
      description: 'Comprehensive roof inspection after recent storm damage',
      contractor: 'Elite Roofing Co.',
      date: '2024-01-18',
      location: 'Exterior',
      price: '150.00',
      status: 'in-progress' as const,
      priority: 'high' as const,
      category: 'Roofing'
    },
    {
      id: 'SR-003',
      title: 'Plumbing Diagnostics',
      description: 'Kitchen sink drainage issue and water pressure check',
      contractor: 'Quick Fix Plumbing',
      date: '2024-01-22',
      location: 'Kitchen',
      price: '120.00',
      status: 'pending' as const,
      priority: 'high' as const,
      category: 'Plumbing'
    },
    {
      id: 'SR-004',
      title: 'Electrical Safety Check',
      description: 'Complete electrical system inspection and code compliance review',
      contractor: 'Safe Spark Electric',
      date: '2024-01-25',
      location: 'Whole House',
      price: '200.00',
      status: 'completed' as const,
      priority: 'medium' as const,
      category: 'Electrical'
    }
  ];

  const getFilterCounts = () => {
    const counts = {
      all: serviceRequests.length,
      pending: serviceRequests.filter(req => req.status === 'pending').length,
      'in-progress': serviceRequests.filter(req => req.status === 'in-progress').length,
      completed: serviceRequests.filter(req => req.status === 'completed').length
    };
    return counts;
  };

  const filteredRequests = serviceRequests.filter(request => {
    const matchesFilter = activeFilter === 'all' || request.status === activeFilter;
    const matchesSearch = searchQuery === '' || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = getFilterCounts();

  const handleNewRequest = () => {
    console.log('New request clicked');
  };

  const handleFilterChange = (filter: FilterTab) => {
    console.log(`Filter changed to: ${filter}`);
    setActiveFilter(filter);
  };

  const handleSearch = (value: string) => {
    console.log(`Search: ${value}`);
    setSearchQuery(value);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="page-title">
            Service Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="page-description">
            Track and manage all your home maintenance requests
          </p>
        </div>
        <Button onClick={handleNewRequest} data-testid="button-new-request">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('all')}
            data-testid="filter-all"
          >
            All Requests ({counts.all})
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
            variant={activeFilter === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('in-progress')}
            data-testid="filter-in-progress"
          >
            In Progress ({counts['in-progress']})
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
          <Button variant="outline" size="icon" data-testid="button-filter">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Service Requests List */}
      <div className="space-y-4" data-testid="requests-list">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <ServiceRequestCard
              key={request.id}
              {...request}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No service requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}