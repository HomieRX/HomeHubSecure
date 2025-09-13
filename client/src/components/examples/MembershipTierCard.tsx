import MembershipTierCard from '../MembershipTierCard';

export default function MembershipTierCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
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
        isCurrentTier
      />
    </div>
  );
}