import { db } from "./db";
import { maintenanceItems, type InsertMaintenanceItem } from "@shared/schema";
import { eq } from "drizzle-orm";

// PreventiT! Maintenance Items Catalog
// These are predefined maintenance tasks with durations, seasonality, and requirements
export const maintenanceItemsData: InsertMaintenanceItem[] = [
  // HVAC Category - Feb-Mar seasonal window
  {
    name: "Change HVAC Filter",
    description: "Replace air filter in HVAC system to ensure optimal air quality and system efficiency",
    category: "HVAC",
    estimatedMinutes: 15,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Basic HVAC knowledge", "Safety procedures"],
    materialsNeeded: ["HVAC filter (appropriate size)", "Disposable gloves"],
    toolsNeeded: ["Flashlight", "Screwdriver (if needed)"],
    safetyNotes: "Turn off HVAC system before replacing filter. Wear gloves when handling old filter.",
    instructions: "1. Turn off HVAC system. 2. Locate filter compartment. 3. Remove old filter noting airflow direction. 4. Install new filter in same direction. 5. Turn system back on.",
  },
  {
    name: "Clean HVAC Vents and Registers",
    description: "Clean all air vents and return registers throughout the home for improved airflow",
    category: "HVAC",
    estimatedMinutes: 45,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Basic cleaning", "Ladder safety"],
    materialsNeeded: ["Vacuum with attachments", "Microfiber cloths", "All-purpose cleaner"],
    toolsNeeded: ["Step ladder", "Screwdriver"],
    safetyNotes: "Use ladder safely with spotter if available. Avoid standing on furniture.",
    instructions: "1. Remove vent covers. 2. Vacuum inside ducts as far as safely reachable. 3. Wash vent covers with soap and water. 4. Wipe down registers. 5. Reinstall when dry.",
  },
  {
    name: "HVAC System Inspection",
    description: "Professional inspection of HVAC system components, refrigerant levels, and performance",
    category: "HVAC",
    estimatedMinutes: 60,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["HVAC certification", "System diagnostics", "Refrigerant handling"],
    materialsNeeded: ["Refrigerant (if needed)", "Filter", "Cleaning solutions"],
    toolsNeeded: ["Multimeter", "Pressure gauges", "Thermometer", "Cleaning tools"],
    safetyNotes: "Only certified technicians should handle refrigerant. Follow electrical safety procedures.",
    instructions: "1. Check all electrical connections. 2. Test system operation. 3. Check refrigerant levels. 4. Clean coils if needed. 5. Document findings and recommendations.",
  },

  // Plumbing Category - Feb-Mar seasonal window  
  {
    name: "Check and Clean Gutters",
    description: "Remove debris from gutters and downspouts to prevent water damage",
    category: "Plumbing",
    estimatedMinutes: 90,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Ladder safety", "Basic maintenance"],
    materialsNeeded: ["Trash bags", "Work gloves", "Garden hose"],
    toolsNeeded: ["Extension ladder", "Trowel or scoop", "Bucket"],
    safetyNotes: "Use proper ladder safety. Have spotter when possible. Be aware of power lines.",
    instructions: "1. Set up ladder safely. 2. Remove debris from gutters. 3. Check for damage or loose brackets. 4. Flush gutters with hose. 5. Test downspout flow.",
  },
  {
    name: "Water Heater Maintenance",
    description: "Flush water heater, check temperature settings, and inspect for issues",
    category: "Plumbing", 
    estimatedMinutes: 75,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Basic plumbing", "Safety procedures", "Water heater knowledge"],
    materialsNeeded: ["Garden hose", "Bucket"],
    toolsNeeded: ["Pipe wrench", "Thermometer", "Flashlight"],
    safetyNotes: "Turn off power/gas before maintenance. Let water cool if needed. Handle hot water carefully.",
    instructions: "1. Turn off power/gas to unit. 2. Connect hose to drain valve. 3. Drain several gallons to remove sediment. 4. Check temperature setting (120°F recommended). 5. Inspect for leaks or corrosion.",
  },

  // Electrical Category - Feb-Mar seasonal window
  {
    name: "Test Smoke and Carbon Monoxide Detectors",
    description: "Test all smoke and CO detectors, replace batteries as needed",
    category: "Electrical",
    estimatedMinutes: 30,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Basic safety awareness"],
    materialsNeeded: ["9V batteries", "AA batteries (if needed)"],
    toolsNeeded: ["Step ladder", "Vacuum (for cleaning)"],
    safetyNotes: "Test devices during daytime when noise won't disturb neighbors.",
    instructions: "1. Press test button on each device. 2. Listen for full alarm sound. 3. Replace batteries if chirping or test fails. 4. Vacuum dust from detector housing. 5. Note expiration dates.",
  },
  {
    name: "GFCI Outlet Testing",
    description: "Test all GFCI outlets and reset breakers to ensure electrical safety",
    category: "Electrical", 
    estimatedMinutes: 20,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Basic electrical safety", "GFCI operation knowledge"],
    materialsNeeded: ["Outlet tester (optional)"],
    toolsNeeded: ["Small electrical device for testing"],
    safetyNotes: "Never test with high-powered devices. If outlet doesn't reset, call electrician.",
    instructions: "1. Press TEST button on GFCI - power should stop. 2. Press RESET button - power should restore. 3. Test with small device. 4. If any fail to reset properly, tag and schedule electrical service.",
  },

  // Exterior Category - Jul-Aug seasonal window
  {
    name: "Exterior Caulk Inspection and Repair",
    description: "Inspect and repair caulking around windows, doors, and exterior penetrations",
    category: "Exterior",
    estimatedMinutes: 120,
    seasonalWindow: "Jul-Aug", 
    requiredSkills: ["Caulking application", "Weather sealing"],
    materialsNeeded: ["Exterior caulk", "Caulk remover", "Cleaning supplies"],
    toolsNeeded: ["Caulk gun", "Utility knife", "Scraper tool", "Ladder"],
    safetyNotes: "Use ladder safely. Work in shade when possible to prevent caulk from drying too quickly.",
    instructions: "1. Remove old, damaged caulk. 2. Clean surfaces thoroughly. 3. Apply new caulk in continuous bead. 4. Smooth with finger or tool. 5. Allow proper cure time.",
  },
  {
    name: "Deck and Patio Maintenance", 
    description: "Clean and inspect deck/patio surfaces, railings, and fasteners",
    category: "Exterior",
    estimatedMinutes: 180,
    seasonalWindow: "Jul-Aug",
    requiredSkills: ["Power washing", "Wood/concrete maintenance"],
    materialsNeeded: ["Deck cleaner", "Wood stain/sealer (if needed)", "Screws/nails"],
    toolsNeeded: ["Power washer", "Brushes", "Drill/driver", "Safety glasses"],
    safetyNotes: "Use power washer safely - start with low pressure. Wear safety glasses and non-slip footwear.",
    instructions: "1. Clear deck completely. 2. Power wash surface. 3. Check all fasteners and railings. 4. Apply cleaner if needed. 5. Note any boards needing replacement.",
  },
  {
    name: "Roof and Gutter Inspection",
    description: "Visual inspection of roof condition, shingles, flashing, and gutter attachment",
    category: "Exterior",
    estimatedMinutes: 60,
    seasonalWindow: "Jul-Aug",
    requiredSkills: ["Roof safety", "Construction knowledge", "Binocular use"],
    materialsNeeded: ["Binoculars", "Camera for documentation"],
    toolsNeeded: ["Binoculars", "Ladder (if safe access available)"],
    safetyNotes: "Do NOT walk on roof unless properly trained and equipped. Use binoculars from ground when possible.",
    instructions: "1. Inspect from ground with binoculars. 2. Look for missing/damaged shingles. 3. Check flashing around chimneys and vents. 4. Note gutter attachment points. 5. Document issues with photos.",
  },

  // General Maintenance - Both seasonal windows
  {
    name: "Deep Clean Dryer Vent",
    description: "Clean dryer vent system from interior to exterior to prevent fire hazard",
    category: "General",
    estimatedMinutes: 45,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Appliance maintenance", "Vent cleaning"],
    materialsNeeded: ["Dryer vent brush", "Vacuum bags"],
    toolsNeeded: ["Drill with brush attachment", "Vacuum", "Screwdriver"],
    safetyNotes: "Disconnect power before cleaning. Be careful of sharp edges in vent system.",
    instructions: "1. Unplug dryer and disconnect vent. 2. Clean lint from inside dryer. 3. Use brush to clean vent ductwork. 4. Clean exterior vent opening. 5. Reconnect and test operation.",
  },
  {
    name: "Whole House Deep Clean",
    description: "Comprehensive cleaning including baseboards, light fixtures, and detailed surfaces",
    category: "General", 
    estimatedMinutes: 240,
    seasonalWindow: "Feb-Mar",
    requiredSkills: ["Professional cleaning techniques"],
    materialsNeeded: ["All-purpose cleaners", "Microfiber cloths", "Vacuum bags", "Glass cleaner"],
    toolsNeeded: ["Vacuum", "Mop", "Step ladder", "Extension duster"],
    safetyNotes: "Use ladder safely. Ensure good ventilation when using cleaning products.",
    instructions: "1. Dust all surfaces including baseboards and light fixtures. 2. Vacuum all floors and furniture. 3. Clean all glass and mirrors. 4. Mop hard surfaces. 5. Clean bathroom and kitchen thoroughly.",
  }
];

export async function seedMaintenanceItems() {
  try {
    console.log("Seeding maintenance items catalog...");
    
    // Insert all maintenance items
    for (const item of maintenanceItemsData) {
      try {
        await db.insert(maintenanceItems).values([item]);
        console.log(`✅ Added: ${item.name}`);
      } catch (error) {
        console.log(`⚠️  Item may already exist: ${item.name}`);
      }
    }
    
    console.log("✅ Maintenance items catalog seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding maintenance items:", error);
    throw error;
  }
}

export async function getMaintenanceItemsByCategory() {
  try {
    const items = await db.select().from(maintenanceItems).where(eq(maintenanceItems.isActive, true));
    
    // Group by category for easy display
    const grouped = items.reduce((acc: Record<string, typeof items>, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof items>);
    
    return grouped;
  } catch (error) {
    console.error("Error fetching maintenance items:", error);
    throw error;
  }
}