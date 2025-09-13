import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign, User } from 'lucide-react';

interface ServiceRequestCardProps {
  id: string;
  title: string;
  description: string;
  contractor: string;
  date: string;
  location: string;
  price: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export default function ServiceRequestCard({
  id,
  title,
  description,
  contractor,
  date,
  location,
  price,
  status,
  priority,
  category
}: ServiceRequestCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">in progress</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">pending</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = () => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">high priority</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">medium priority</Badge>;
      case 'low':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs">low priority</Badge>;
      default:
        return null;
    }
  };

  const handleCardClick = () => {
    console.log(`Service request ${id} clicked`);
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all duration-200 bg-card border-card-border"
      onClick={handleCardClick}
      data-testid={`service-request-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-1" data-testid="request-id">
              {id}
            </Badge>
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{category}</div>
            <div className="text-xs text-muted-foreground">
              {status === 'completed' ? 'Completed' : 'Scheduled'} {date}
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-2" data-testid="request-title">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4" data-testid="request-description">
          {description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-medium">
                  {contractor.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-foreground" data-testid="contractor-name">{contractor}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span data-testid="request-date">{date}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span data-testid="request-location">{location}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <DollarSign className="h-4 w-4" />
            <span data-testid="request-price">{price}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}