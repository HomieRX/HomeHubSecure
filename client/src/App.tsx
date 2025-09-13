import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import MembershipTierCard from "@/components/MembershipTierCard";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { Wrench, Shield, Hammer, CheckCircle } from 'lucide-react';

function HomePage() {
  //todo: remove mock functionality when backend is implemented
  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      
      <Header userTier="HomePRO" isAuthenticated={true} />
      
      <main>
        <Hero />
        
        {/* Services Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900" data-testid="services-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Services</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive home services designed to keep your property in perfect condition
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ServiceCard
                title="FixiT!"
                description="Professional home diagnostics and repairs by certified Home Managers"
                icon={Wrench}
                price="$70/hr"
                features={[
                  "1-hour diagnostic session", 
                  "Appliance troubleshooting", 
                  "Basic system repairs", 
                  "Follow-up scheduling"
                ]}
                status="available"
              />
              
              <ServiceCard
                title="PreventiT!"
                description="Bi-annual preventive maintenance to keep your home in top condition"
                icon={Shield}
                features={[
                  "60-90 minute sessions", 
                  "Seasonal maintenance", 
                  "Photo documentation", 
                  "HomeVitals integration"
                ]}
                status="seasonal"
              />
              
              <ServiceCard
                title="HandleiT!"
                description="Connect with verified contractors for larger home improvement projects"
                icon={Hammer}
                features={[
                  "Private contractor bidding", 
                  "Escrow payment protection", 
                  "Project milestone tracking", 
                  "Quality assurance"
                ]}
                status="available"
              />
              
              <ServiceCard
                title="CheckiT!"
                description="Comprehensive home health inspections and reporting"
                icon={CheckCircle}
                features={[
                  "Home health scoring", 
                  "Safety assessments", 
                  "Detailed reporting", 
                  "Insurance integration"
                ]}
                status="coming-soon"
              />
            </div>
          </div>
        </section>
        
        {/* Membership Tiers Section */}
        <section className="py-16" data-testid="membership-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Membership Plans</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the perfect plan for your home management needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MembershipTierCard
                name="HomeHUB"
                price="Free"
                description="Community access and basic features"
                features={[
                  "Community feed access",
                  "Neighborhood updates",
                  "Basic contractor directory",
                  "Educational resources"
                ]}
              />
              
              <MembershipTierCard
                name="HomePRO"
                price="$49"
                description="Essential home services for busy homeowners"
                features={[
                  "PreventiT! 60-min sessions",
                  "FixiT! at $70/hr",
                  "2 concurrent bookings",
                  "HandleiT! contractor access",
                  "LoyalizeiT! rewards"
                ]}
                isPopular
                isCurrentTier
              />
              
              <MembershipTierCard
                name="HomeHERO"
                price="$79"
                description="Advanced features for proactive home management"
                features={[
                  "PreventiT! 90-min sessions",
                  "FixiT! at $60/hr",
                  "Priority scheduling",
                  "CheckiT! inspections",
                  "Enhanced rewards"
                ]}
              />
              
              <MembershipTierCard
                name="HomeGURU"
                price="$129"
                description="All-inclusive home management solution"
                features={[
                  "PreventiT! 120-min sessions",
                  "FixiT! at $55/hr",
                  "Bundle Builder access",
                  "Premium contractor network",
                  "Unlimited HomeVitals"
                ]}
              />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
