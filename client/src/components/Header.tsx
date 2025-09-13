import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Home, Settings, Bell, User } from 'lucide-react';

interface HeaderProps {
  userTier?: 'HomeHUB' | 'HomePRO' | 'HomeHERO' | 'HomeGURU';
  isAuthenticated?: boolean;
}

export default function Header({ userTier = 'HomeHUB', isAuthenticated = false }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    console.log('Mobile menu toggled');
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (section: string) => {
    console.log(`Navigating to ${section}`);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HomePRO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HomeHERO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'HomeGURU': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Home className="h-8 w-8 text-primary" data-testid="logo-icon" />
            <span className="text-xl font-bold text-foreground" data-testid="logo-text">HomeHub</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => handleNavClick('services')}
              data-testid="nav-services"
            >
              Services
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleNavClick('community')}
              data-testid="nav-community"
            >
              CommuniT!
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleNavClick('marketplace')}
              data-testid="nav-marketplace"
            >
              Marketplace
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleNavClick('vitals')}
              data-testid="nav-vitals"
            >
              HomeVitals
            </Button>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Badge 
                  className={getTierColor(userTier)}
                  data-testid="user-tier-badge"
                >
                  {userTier}
                </Badge>
                <Button size="icon" variant="ghost" data-testid="button-notifications">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" data-testid="button-profile">
                  <User className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => handleNavClick('login')}
                  data-testid="button-login"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => handleNavClick('signup')}
                  data-testid="button-signup"
                >
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button 
              size="icon" 
              variant="ghost" 
              className="md:hidden"
              onClick={handleMobileMenuToggle}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4" data-testid="mobile-menu">
            <nav className="flex flex-col gap-2">
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={() => handleNavClick('services')}
                data-testid="mobile-nav-services"
              >
                Services
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={() => handleNavClick('community')}
                data-testid="mobile-nav-community"
              >
                CommuniT!
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={() => handleNavClick('marketplace')}
                data-testid="mobile-nav-marketplace"
              >
                Marketplace
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={() => handleNavClick('vitals')}
                data-testid="mobile-nav-vitals"
              >
                HomeVitals
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}