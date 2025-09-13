import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  price?: string;
  features: string[];
  status?: 'available' | 'seasonal' | 'coming-soon';
  onBook?: () => void;
  onLearnMore?: () => void;
}

export default function ServiceCard({
  title,
  description,
  icon: Icon,
  price,
  features,
  status = 'available',
  onBook,
  onLearnMore
}: ServiceCardProps) {
  const handleBook = () => {
    console.log(`Booking ${title}`);
    onBook?.();
  };

  const handleLearnMore = () => {
    console.log(`Learning more about ${title}`);
    onLearnMore?.();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'seasonal':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Seasonal</Badge>;
      case 'coming-soon':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Coming Soon</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</Badge>;
    }
  };

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`service-card-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="h-6 w-6 text-primary" data-testid="service-icon" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid="service-title">{title}</CardTitle>
              {price && (
                <div className="text-lg font-semibold text-primary mt-1" data-testid="service-price">
                  {price}
                </div>
              )}
            </div>
          </div>
          <div data-testid="service-status">
            {getStatusBadge()}
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground" data-testid="service-description">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Features List */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-2">Includes:</h4>
            <ul className="space-y-1" data-testid="service-features">
              {features.map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              onClick={handleBook}
              disabled={status === 'coming-soon'}
              data-testid="button-book-service"
            >
              {status === 'coming-soon' ? 'Coming Soon' : 'Book Now'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLearnMore}
              data-testid="button-learn-more-service"
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}