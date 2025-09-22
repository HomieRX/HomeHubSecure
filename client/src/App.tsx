import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import ForumList from "@/pages/ForumList";
import Forum from "@/pages/Forum";
import ForumTopic from "@/pages/ForumTopic";
import ContractorsDirectory from "@/pages/ContractorsDirectory";
import MerchantsDirectory from "@/pages/MerchantsDirectory";
import BadgesPage from "@/pages/BadgesPage";
import RanksPage from "@/pages/RanksPage";
import AchievementsPage from "@/pages/AchievementsPage";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

// Registration pages
import RegistrationLanding from "@/pages/registration/RegistrationLanding";
import ContractorRegistration from "@/pages/registration/ContractorRegistration";
import MerchantRegistration from "@/pages/registration/MerchantRegistration";
import HomeHubRegistration from "@/pages/registration/HomeHubRegistration";
import HomeProRegistration from "@/pages/registration/HomeProRegistration";
import HomeHeroRegistration from "@/pages/registration/HomeHeroRegistration";
import HomeGuruRegistration from "@/pages/registration/HomeGuruRegistration";

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
      <Route path="/forums" component={ForumList}/>
      <Route path="/forums/:forumId/topics/:topicId" component={ForumTopic}/>
      <Route path="/forums/:forumId" component={Forum}/>
      <Route path="/profile" component={Profile}/>
      <Route path="/profile/home-details" component={HomeDetails}/>
      <Route path="/calendar" component={Calendar}/>
      <Route path="/messages" component={Messages}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Switch>
            {/* Admin route with its own layout */}
            <Route path="/admin" component={Admin} />
            
            {/* Registration routes */}
            <Route path="/register" component={RegistrationLanding} />
            <Route path="/register/contractor" component={ContractorRegistration} />
            <Route path="/register/merchant" component={MerchantRegistration} />
            <Route path="/register/homehub" component={HomeHubRegistration} />
            <Route path="/register/homepro" component={HomeProRegistration} />
            <Route path="/register/homehero" component={HomeHeroRegistration} />
            <Route path="/register/homeguru" component={HomeGuruRegistration} />
            
            {/* Default layout for all other routes */}
            <Route>
              <DashboardLayout>
                <Router />
              </DashboardLayout>
            </Route>
          </Switch>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
