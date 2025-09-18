import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface RegistrationLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  className?: string;
}

export function RegistrationLayout({
  title,
  subtitle,
  children,
  showBackButton = true,
  backHref = "/",
  className
}: RegistrationLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)} data-testid="registration-layout">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  data-testid="button-back"
                >
                  <Link href={backHref}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
              )}
              
              <Link href="/" className="flex items-center gap-2" data-testid="link-home">
                <Home className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">HomeHub</span>
              </Link>
            </div>
            
            <div className="text-sm text-muted-foreground" data-testid="text-help">
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8" data-testid="registration-main">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8" data-testid="registration-header">
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="page-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground" data-testid="page-subtitle">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div data-testid="registration-content">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div data-testid="footer-left">
              © 2024 HomeHub. All rights reserved.
            </div>
            <div className="flex gap-6" data-testid="footer-links">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}