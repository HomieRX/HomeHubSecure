import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegistrationLayout } from "@/components/registration";
import { 
  Building2, 
  Store, 
  Home, 
  Star, 
  Crown, 
  Gem, 
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  Zap
} from "lucide-react";

const REGISTRATION_OPTIONS = [
  {
    id: "contractor",
    title: "Contractor Registration",
    description: "Join our network of trusted service professionals",
    icon: <Building2 className="h-8 w-8" />,
    href: "/register/contractor",
    features: [
      "Get connected with local homeowners",
      "Manage your business profile and credentials",
      "Receive service requests and quotes",
      "Build your reputation with reviews"
    ],
    buttonText: "Register as Contractor",
    buttonVariant: "default" as const,
    requirements: "Business license and insurance required"
  },
  {
    id: "merchant",
    title: "Merchant Registration", 
    description: "Partner with HomeHub to reach more customers",
    icon: <Store className="h-8 w-8" />,
    href: "/register/merchant",
    features: [
      "Showcase your products and services",
      "Connect with homeowners in your area", 
      "Manage orders and customer relationships",
      "Grow your business with our platform"
    ],
    buttonText: "Register as Merchant",
    buttonVariant: "default" as const,
    requirements: "Business license and tax ID required"
  }
];

const MEMBERSHIP_OPTIONS = [
  {
    id: "homehub",
    title: "HomeHUB",
    description: "Perfect for basic home maintenance needs",
    icon: <Home className="h-6 w-6" />,
    href: "/register/homehub",
    price: "Free",
    popular: false,
    features: [
      "Basic service requests",
      "Community forum access",
      "Standard customer support",
      "Mobile app access"
    ]
  },
  {
    id: "homepro",
    title: "HomePRO", 
    description: "Enhanced features for serious homeowners",
    icon: <Star className="h-6 w-6" />,
    href: "/register/homepro",
    price: "$19.99/month",
    popular: true,
    features: [
      "Everything in HomeHUB",
      "Priority service booking",
      "10% discount on services",
      "Advanced home management tools",
      "24/7 emergency support"
    ]
  },
  {
    id: "homehero",
    title: "HomeHERO",
    description: "Premium service for property enthusiasts", 
    icon: <Crown className="h-6 w-6" />,
    href: "/register/homehero",
    price: "$39.99/month",
    popular: false,
    features: [
      "Everything in HomePRO",
      "White-glove service experience",
      "Dedicated account manager",
      "20% discount on all services",
      "Concierge services"
    ]
  },
  {
    id: "homeguru",
    title: "HomeGURU",
    description: "Ultimate luxury home management",
    icon: <Gem className="h-6 w-6" />,
    href: "/register/homeguru", 
    price: "$79.99/month",
    popular: false,
    features: [
      "Everything in HomeHERO",
      "Exclusive elite contractor network",
      "30% discount on all services", 
      "Smart home integration",
      "VIP event invitations"
    ]
  }
];

export default function RegistrationLanding() {
  return (
    <RegistrationLayout
      title="Join HomeHub"
      subtitle="Choose how you'd like to be part of our home services community"
      showBackButton={false}
    >
      <div className="space-y-12">
        {/* Business Registration Section */}
        <section data-testid="business-registration-section">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="business-section-title">
              Business Registration
            </h2>
            <p className="text-muted-foreground" data-testid="business-section-description">
              Join our network of trusted service providers and local businesses
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {REGISTRATION_OPTIONS.map((option) => (
              <Card 
                key={option.id} 
                className="relative h-full hover-elevate transition-all duration-200"
                data-testid={`card-${option.id}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {option.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl" data-testid={`title-${option.id}`}>
                        {option.title}
                      </CardTitle>
                      <CardDescription data-testid={`description-${option.id}`}>
                        {option.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2" data-testid={`features-${option.id}`}>
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-xs text-muted-foreground border-t pt-4">
                    <Shield className="h-3 w-3 inline mr-1" />
                    {option.requirements}
                  </div>

                  <Button
                    asChild
                    className="w-full"
                    variant={option.buttonVariant}
                    data-testid={`button-${option.id}`}
                  >
                    <Link href={option.href}>
                      {option.buttonText}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Membership Section */}
        <section data-testid="membership-section">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="membership-section-title">
              Homeowner Membership
            </h2>
            <p className="text-muted-foreground" data-testid="membership-section-description">
              Choose the membership tier that best fits your home management needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MEMBERSHIP_OPTIONS.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative h-full transition-all duration-200 hover-elevate ${
                  tier.popular ? "ring-2 ring-primary shadow-lg" : ""
                }`}
                data-testid={`membership-card-${tier.id}`}
              >
                {tier.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                    data-testid={`popular-badge-${tier.id}`}
                  >
                    <Badge variant="default" className="bg-primary text-primary-foreground px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2" data-testid={`icon-${tier.id}`}>
                    {tier.icon}
                  </div>
                  <CardTitle className="text-lg" data-testid={`tier-title-${tier.id}`}>
                    {tier.title}
                  </CardTitle>
                  <CardDescription data-testid={`tier-description-${tier.id}`}>
                    {tier.description}
                  </CardDescription>
                  <div className="text-2xl font-bold mt-2" data-testid={`tier-price-${tier.id}`}>
                    {tier.price}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2" data-testid={`tier-features-${tier.id}`}>
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    data-testid={`button-tier-${tier.id}`}
                  >
                    <Link href={tier.href}>
                      Choose {tier.title}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="bg-muted/20 rounded-lg p-8" data-testid="info-section">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4" data-testid="info-title">
              Why Choose HomeHub?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center" data-testid="benefit-trusted">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-2">Trusted Network</h4>
                <p className="text-sm text-muted-foreground">
                  All contractors are verified, licensed, and insured for your peace of mind
                </p>
              </div>
              <div className="text-center" data-testid="benefit-community">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-2">Community Driven</h4>
                <p className="text-sm text-muted-foreground">
                  Connect with neighbors, share experiences, and get recommendations
                </p>
              </div>
              <div className="text-center" data-testid="benefit-convenience">
                <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-2">Convenient</h4>
                <p className="text-sm text-muted-foreground">
                  Manage everything from one platform - requests, payments, and communication
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center" data-testid="cta-section">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-2" data-testid="cta-title">
              Ready to Get Started?
            </h3>
            <p className="text-muted-foreground mb-6" data-testid="cta-description">
              Join thousands of homeowners, contractors, and merchants who trust HomeHub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" data-testid="cta-homeowner">
                <Link href="/register/homehub">
                  Start as Homeowner
                  <Home className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" data-testid="cta-business">
                <Link href="/register/contractor">
                  Register Business
                  <Building2 className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </RegistrationLayout>
  );
}