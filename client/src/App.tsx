import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ServiceRequests from "@/pages/ServiceRequests";
import NotFound from "@/pages/not-found";

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to your HomeHub dashboard.</p>
    </div>
  );
}

function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Home</h1>
      <p className="text-muted-foreground">Welcome to HomeHub - your digital headquarters for home services.</p>
    </div>
  );
}

function StorePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Store</h1>
      <p className="text-muted-foreground">Browse home improvement products and services.</p>
    </div>
  );
}

function InvoicesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Invoices</h1>
      <p className="text-muted-foreground">Manage your service invoices and payments.</p>
    </div>
  );
}

function ContractorsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Contractors</h1>
      <p className="text-muted-foreground">Find and manage trusted contractors in your area.</p>
    </div>
  );
}

function SavvySaverPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Savvy Saver</h1>
      <p className="text-muted-foreground">Discover local deals and offers from merchants.</p>
    </div>
  );
}

function CheckITPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">CheckIT!</h1>
      <p className="text-muted-foreground">Schedule comprehensive home health inspections.</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage}/>
      <Route path="/dashboard" component={DashboardPage}/>
      <Route path="/store" component={StorePage}/>
      <Route path="/service-requests" component={ServiceRequests}/>
      <Route path="/invoices" component={InvoicesPage}/>
      <Route path="/contractors" component={ContractorsPage}/>
      <Route path="/savvy-saver" component={SavvySaverPage}/>
      <Route path="/checkit" component={CheckITPage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Custom sidebar width for platform application
  const style = {
    "--sidebar-width": "16rem",       // 256px for better navigation
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b border-border bg-card">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="text-sm text-muted-foreground">
                  HomeHub Platform
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
