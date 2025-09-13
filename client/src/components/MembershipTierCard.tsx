import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Zap } from 'lucide-react';

interface MembershipTierCardProps {
  name: 'HomeHUB' | 'HomePRO' | 'HomeHERO' | 'HomeGURU';
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isCurrentTier?: boolean;
  onSelect?: () => void;
}

export default function MembershipTierCard({
  name,
  price,
  description,
  features,
  isPopular = false,
  isCurrentTier = false,
  onSelect
}: MembershipTierCardProps) {
  const handleSelect = () => {
    console.log(`Selected ${name} tier`);
    onSelect?.();
  };

  const getTierIcon = () => {
    switch (name) {
      case 'HomePRO': return <Star className="h-5 w-5" />;
      case 'HomeHERO': return <Crown className="h-5 w-5" />;
      case 'HomeGURU': return <Zap className="h-5 w-5" />;
      default: return null;
    }
  };

  const getTierColor = () => {
    switch (name) {
      case 'HomePRO': return 'text-blue-600 dark:text-blue-400';
      case 'HomeHERO': return 'text-purple-600 dark:text-purple-400';
      case 'HomeGURU': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getCardStyle = () => {
    if (isPopular) {
      return 'border-primary shadow-lg hover-elevate';
    }
    return 'hover-elevate';
  };

  return (
    <Card className={`relative ${getCardStyle()} transition-all duration-200`} data-testid={`tier-card-${name.toLowerCase()}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1" data-testid="popular-badge">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getTierIcon() && (
            <div className={getTierColor()}>
              {getTierIcon()}
            </div>
          )}
          <CardTitle className={`text-xl ${getTierColor()}`} data-testid="tier-name">
            {name}
          </CardTitle>
        </div>
        
        <div className="mb-2">
          <span className="text-3xl font-bold" data-testid="tier-price">{price}</span>
          {price !== 'Free' && <span className="text-muted-foreground">/month</span>}
        </div>
        
        <CardDescription data-testid="tier-description">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Features List */}
          <ul className="space-y-3" data-testid="tier-features">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          <div className="pt-4">
            {isCurrentTier ? (
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
                data-testid="button-current-tier"
              >
                Current Plan
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleSelect}
                variant={isPopular ? 'default' : 'outline'}
                data-testid="button-select-tier"
              >
                {name === 'HomeHUB' ? 'Get Started Free' : 'Upgrade Now'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}