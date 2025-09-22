import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    href: string;
    title: string;
    icon?: React.ReactNode;
    label?: string;
    variant?: "default" | "ghost";
  }[];
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [location] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Navigation items - customize based on your routes
  const sidebarNavItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: <div className="w-4 h-4" />, // Add your icon component
      variant: location === "/dashboard" ? "default" : "ghost",
    },
    {
      title: "Maintenance",
      href: "/maintenance",
      icon: <div className="w-4 h-4" />, // Add your icon component
      variant: location === "/maintenance" ? "default" : "ghost",
    },
    // Add more navigation items here
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar */}
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="!px-0">
            <div className="space-y-4 py-4">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold">
                  HomeHub Secure
                </h2>
                <div className="space-y-1">
                  <SidebarNav items={sidebarNavItems} />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <aside className="hidden w-[270px] flex-col lg:flex">
          <Card className="flex h-full flex-col rounded-none border-r shadow-none">
            <div className="p-6">
              <Link href="/">
                <div className="flex items-center gap-2 font-semibold">
                  HomeHub Secure
                </div>
              </Link>
            </div>
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <div className="px-3 py-2">
                  <div className="space-y-1">
                    <SidebarNav items={sidebarNavItems} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </aside>
      )}
      <main className="flex-1">
        <div className="border-b">
          <div className="flex h-16 items-center gap-4 px-4">
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="space-y-4 p-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarNav({ items, className, ...props }: SidebarNavProps) {
  const [location] = useLocation();

  return (
    <nav className={cn("grid gap-1", className)} {...props}>
      {items.map((item, index) => {
        const isActive = item.href === location;
        return (
          <Link
            key={index}
            href={item.href}
          >
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent" : "transparent",
                item.variant === "default" && "bg-accent"
              )}
            >
              {item.icon && (
                <span className="mr-2 h-4 w-4">
                  {item.icon}
                </span>
              )}
              <span>{item.title}</span>
              {item.label && (
                <span className="ml-auto">{item.label}</span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}