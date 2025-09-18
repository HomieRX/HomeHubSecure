import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Gem, Home } from "lucide-react";

export type MembershipTier = "HomeHUB" | "HomePRO" | "HomeHERO" | "HomeGURU";

interface MembershipTierInfo {
  id: MembershipTier;
  name: string;
  description: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popularBadge?: boolean;
  premium?: boolean;
}

const MEMBERSHIP_TIERS: MembershipTierInfo[] = [
  {
    id: "HomeHUB",
    name: "HomeHUB",
    description: "Perfect for basic home maintenance needs",
    icon: <Home className="h-6 w-6" />,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Basic service requests",
      "Community forum access",
      "Standard customer support",
      "Mobile app access",
      "Basic home profile"
    ]
  },
  {
    id: "HomePRO",
    name: "HomePRO",
    description: "Enhanced features for serious homeowners",
    icon: <Star className="h-6 w-6" />,
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    popularBadge: true,
    features: [
      "Everything in HomeHUB",
      "Priority service booking",
      "Discounted service rates (10%)",
      "Advanced home management tools",
      "Maintenance reminders",
      "Extended warranty coverage",
      "24/7 emergency support"
    ]
  },
  {
    id: "HomeHERO",
    name: "HomeHERO",
    description: "Premium service for property enthusiasts",
    icon: <Crown className="h-6 w-6" />,
    monthlyPrice: 39.99,
    yearlyPrice: 399.99,
    premium: true,
    features: [
      "Everything in HomePRO",
      "White-glove service experience",
      "Dedicated account manager",
      "Premium contractor network",
      "20% discount on all services",
      "Home value tracking",
      "Concierge services",
      "Seasonal maintenance bundles"
    ]
  },
  {
    id: "HomeGURU",
    name: "HomeGURU",
    description: "Ultimate luxury home management",
    icon: <Gem className="h-6 w-6" />,
    monthlyPrice: 79.99,
    yearlyPrice: 799.99,
    premium: true,
    features: [
      "Everything in HomeHERO",
      "Exclusive elite contractor network",
      "30% discount on all services",
      "Unlimited service consultations",
      "Smart home integration",
      "Property investment advice",
      "VIP event invitations",
      "Annual home audit included"
    ]
  }
];

interface MembershipTierCardProps {
  tier: MembershipTierInfo;
  selected?: boolean;
  onSelect?: (tierId: MembershipTier) => void;
  billingCycle?: "monthly" | "yearly";
  className?: string;
}

export function MembershipTierCard({ 
  tier, 
  selected = false, 
  onSelect, 
  billingCycle = "monthly",
  className 
}: MembershipTierCardProps) {
  const price = billingCycle === "yearly" ? tier.yearlyPrice : tier.monthlyPrice;
  const savings = billingCycle === "yearly" && tier.monthlyPrice > 0 
    ? Math.round(((tier.monthlyPrice * 12) - tier.yearlyPrice) * 100) / 100
    : 0;

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 cursor-pointer",
        selected && "ring-2 ring-primary shadow-lg",
        tier.premium && "border-gradient-to-r from-purple-500 to-amber-500",
        className
      )}
      onClick={() => onSelect?.(tier.id)}
      data-testid={`membership-card-${tier.id}`}
    >
      {/* Popular Badge */}
      {tier.popularBadge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2" data-testid="popular-badge">
          <Badge variant="default" className="bg-primary text-primary-foreground px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Premium Badge */}
      {tier.premium && (
        <div className="absolute -top-3 right-4" data-testid="premium-badge">
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-amber-500 text-white">
            Premium
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2" data-testid={`tier-icon-${tier.id}`}>
          {tier.icon}
        </div>
        <CardTitle className="text-xl" data-testid={`tier-name-${tier.id}`}>
          {tier.name}
        </CardTitle>
        <CardDescription data-testid={`tier-description-${tier.id}`}>
          {tier.description}
        </CardDescription>
        
        {/* Pricing */}
        <div className="mt-4" data-testid={`tier-pricing-${tier.id}`}>
          {tier.monthlyPrice === 0 ? (
            <div className="text-3xl font-bold">Free</div>
          ) : (
            <>
              <div className="text-3xl font-bold">
                ${price}
                <span className="text-sm font-normal text-muted-foreground">
                  /{billingCycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              {savings > 0 && (
                <div className="text-sm text-green-600 font-medium" data-testid={`savings-${tier.id}`}>
                  Save ${savings}/year
                </div>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Features List */}
        <ul className="space-y-3" data-testid={`features-list-${tier.id}`}>
          {tier.features.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start gap-2"
              data-testid={`feature-${tier.id}-${index}`}
            >
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Select Button */}
        <Button
          className="w-full mt-6"
          variant={selected ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(tier.id);
          }}
          data-testid={`button-select-${tier.id}`}
        >
          {selected ? "Selected" : `Choose ${tier.name}`}
        </Button>
      </CardContent>
    </Card>
  );
}

interface MembershipTierSelectorProps {
  selectedTier?: MembershipTier;
  onTierSelect?: (tier: MembershipTier) => void;
  billingCycle?: "monthly" | "yearly";
  className?: string;
}

export function MembershipTierSelector({ 
  selectedTier, 
  onTierSelect, 
  billingCycle = "monthly",
  className 
}: MembershipTierSelectorProps) {
  return (
    <div className={cn("w-full", className)} data-testid="membership-tier-selector">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MEMBERSHIP_TIERS.map((tier) => (
          <MembershipTierCard
            key={tier.id}
            tier={tier}
            selected={selectedTier === tier.id}
            onSelect={onTierSelect}
            billingCycle={billingCycle}
          />
        ))}
      </div>
    </div>
  );
}

export { MEMBERSHIP_TIERS };