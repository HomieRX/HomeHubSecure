import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PlatformHeader } from "@/components/PlatformHeader";
import Services from "@/pages/Services";
import FixiT from "@/pages/FixiT";
import ServiceRequests from "@/pages/ServiceRequests";
import Profile from "@/pages/Profile";
import HomeDetails from "@/pages/HomeDetails";
import Calendar from "@/pages/Calendar";
import Messages from "@/pages/Messages";
import Repairs from "@/pages/Repairs";
import Maintenance from "@/pages/Maintenance";
import Inspections from "@/pages/Inspections";
import Rewards from "@/pages/Rewards";
import Contractors from "@/pages/Contractors";
import Estimates from "@/pages/Estimates";
import Merchants from "@/pages/Merchants";
import Community from "@/pages/Community";
import Timeline from "@/pages/Timeline";
import Groups from "@/pages/Groups";
import SavvySaver from "@/pages/SavvySaver";
import ContractorsDirectory from "@/pages/ContractorsDirectory";
import MerchantsDirectory from "@/pages/MerchantsDirectory";
import BadgesPage from "@/pages/BadgesPage";
import RanksPage from "@/pages/RanksPage";
import AchievementsPage from "@/pages/AchievementsPage";
import Admin from "@/pages/Admin";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage}/>
      <Route path="/dashboard" component={DashboardPage}/>
      <Route path="/services" component={Services}/>
      <Route path="/fixit" component={FixiT}/>
      <Route path="/store" component={StorePage}/>
      <Route path="/service-requests" component={ServiceRequests}/>
      <Route path="/invoices" component={InvoicesPage}/>
      <Route path="/repairs" component={Repairs}/>
      <Route path="/maintenance" component={Maintenance}/>
      <Route path="/inspections" component={Inspections}/>
      <Route path="/rewards" component={Rewards}/>
      <Route path="/badges" component={BadgesPage}/>
      <Route path="/ranks" component={RanksPage}/>
      <Route path="/achievements" component={AchievementsPage}/>
      <Route path="/contractors" component={ContractorsDirectory}/>
      <Route path="/estimates" component={Estimates}/>
      <Route path="/merchants" component={MerchantsDirectory}/>
      <Route path="/savvy-saver" component={SavvySaver}/>
      <Route path="/community" component={Community}/>
      <Route path="/timeline" component={Timeline}/>
      <Route path="/groups" component={Groups}/>
      <Route path="/profile" component={Profile}/>
      <Route path="/profile/home-details" component={HomeDetails}/>
      <Route path="/calendar" component={Calendar}/>
      <Route path="/messages" component={Messages}/>
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
        <Switch>
          {/* Admin route with its own layout */}
          <Route path="/admin" component={Admin} />
          
          {/* All other routes use the standard layout */}
          <Route>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full bg-background">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <PlatformHeader />
                  <main className="flex-1 overflow-auto bg-background">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
