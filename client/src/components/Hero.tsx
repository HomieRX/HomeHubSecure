import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Users, Wrench } from 'lucide-react';
import heroImage from '@assets/generated_images/Beautiful_modern_home_exterior_b8a45e3e.png';

export default function Hero() {
  const handleGetStarted = () => {
    console.log('Get started clicked');
  };

  const handleLearnMore = () => {
    console.log('Learn more clicked');
  };

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Beautiful modern home" 
          className="w-full h-full object-cover"
          data-testid="hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" data-testid="hero-title">
            Your Digital HQ for 
            <span className="text-blue-400">Home Services</span>
          </h1>
          
          <p className="text-xl text-gray-200 mb-8 leading-relaxed" data-testid="hero-description">
            Connect with trusted contractors, schedule preventive maintenance, and manage your home 
            with confidence. Join thousands of homeowners building stronger communities.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30" data-testid="feature-fixit">
              <Wrench className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">FixiT! Diagnostics</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30" data-testid="feature-preventit">
              <Shield className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">PreventiT! Maintenance</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30" data-testid="feature-community">
              <Users className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">CommuniT! Network</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="backdrop-blur-sm bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={handleLearnMore}
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div data-testid="stat-members">
              <div className="text-2xl font-bold">15K+</div>
              <div className="text-sm text-gray-300">Active Members</div>
            </div>
            <div data-testid="stat-contractors">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm text-gray-300">Trusted Contractors</div>
            </div>
            <div data-testid="stat-completed">
              <div className="text-2xl font-bold">25K+</div>
              <div className="text-sm text-gray-300">Jobs Completed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}