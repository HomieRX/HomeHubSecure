import ServiceCard from '../ServiceCard';
import { Wrench, Shield, Hammer, CheckCircle } from 'lucide-react';

export default function ServiceCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
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
  );
}