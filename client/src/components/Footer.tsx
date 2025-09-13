import { Home, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const handleLinkClick = (section: string) => {
    console.log(`Footer link clicked: ${section}`);
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" data-testid="footer-logo-icon" />
              <span className="text-lg font-bold text-foreground" data-testid="footer-logo-text">HomeHub</span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="footer-description">
              Your digital headquarters for home services, connecting homeowners with trusted contractors and community resources.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleLinkClick('contact')} data-testid="button-contact">
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" data-testid="footer-services-title">Services</h3>
            <ul className="space-y-2" data-testid="footer-services-list">
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('fixit')}>
                  FixiT! Diagnostics
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('preventit')}>
                  PreventiT! Maintenance
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('handleit')}>
                  HandleiT! Contractors
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('checkit')}>
                  CheckiT! Inspections
                </Button>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" data-testid="footer-community-title">Community</h3>
            <ul className="space-y-2" data-testid="footer-community-list">
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('community')}>
                  CommuniT! Network
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('rewards')}>
                  LoyalizeiT! Rewards
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('offers')}>
                  Savvy Saver Deals
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('vitals')}>
                  HomeVitals Reports
                </Button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4" data-testid="footer-support-title">Support</h3>
            <ul className="space-y-2" data-testid="footer-support-list">
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('help')}>
                  Help Center
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('pricing')}>
                  Pricing Plans
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('contractors')}>
                  For Contractors
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('merchants')}>
                  For Merchants
                </Button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground" data-testid="footer-copyright">
              © 2024 HomeHub. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('privacy')}>
                Privacy Policy
              </Button>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleLinkClick('terms')}>
                Terms of Service
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}