# HomeHub Design Guidelines

## Design Approach
**Platform-First Approach**: Professional dashboard interface inspired by **Linear**, **Notion**, and **Stripe Dashboard** for enterprise-grade home services management. This is a secure platform that requires sophisticated navigation, data visualization, and workflow management capabilities.

## Core Design Elements

### Color Palette
**Primary Brand**: 220 85% 35% (Deep professional blue conveying trust and reliability)
**Secondary**: 220 25% 95% (Light blue-gray for backgrounds)
**Success**: 142 70% 45% (Green for completed services)
**Warning**: 38 95% 55% (Orange for pending/scheduled items)
**Error**: 0 75% 55% (Red for issues/cancellations)

**Dark Mode**: 
- Background: 220 15% 8%
- Surface: 220 15% 12%
- Text: 220 10% 95%

### Typography
**Primary**: Inter (headings, UI elements)
**Secondary**: System fonts (body text, forms)
**Sizes**: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

### Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16 (p-4, m-8, gap-6, etc.)
**Grid**: 12-column responsive grid with consistent gutters
**Max Width**: max-w-7xl for main content areas

### Component Library

**Navigation**: 
- Top navigation with HomeHub logo, service categories, and profile dropdown
- Sidebar for dashboard views with role-based menu items
- Mobile: Collapsible hamburger menu

**Service Cards**:
- Clean card design with service icons, pricing, and CTA buttons
- Status indicators for FixiT!, PreventiT!, HandleiT!, CheckiT! services
- Membership tier badges (HomeHUB, HomePRO, HomeHERO, HomeGURU)

**Dashboard Components**:
- KPI cards with large numbers and trend indicators
- Calendar/scheduling interface with time slot availability
- Progress trackers for service workflows
- Points/rewards display with LoyalizeiT! branding

**Forms**:
- Multi-step forms for service requests
- Clean input styling with proper validation states
- Consistent button styling across all forms

**Data Displays**:
- Service history tables with sortable columns
- Contractor profiles with ratings and reviews
- Capacity management charts for admin views

## Visual Treatment

**Gradients**: Subtle blue gradients (220 85% 35% to 220 65% 45%) for hero sections and primary CTAs

**Background Treatments**: Light geometric patterns or subtle texture overlays in service category sections

**Imagery**: Professional photography of home services, clean contractor headshots, before/after home improvement photos

## Images
- **Hero Image**: Large banner showcasing a beautiful, well-maintained home with subtle overlay
- **Service Category Icons**: Simple, consistent iconography for each service type
- **Contractor Photos**: Professional headshots in circular frames
- **Before/After Gallery**: Grid layout showcasing completed projects

**Button Styling on Images**: Use `backdrop-blur-sm bg-white/20 border border-white/30` for outline buttons overlaid on hero images.

## Key Principles
1. **Trust-Building**: Professional aesthetic that instills confidence in home service decisions
2. **Role Clarity**: Clear visual hierarchy distinguishing member, contractor, and admin interfaces  
3. **Service Transparency**: Easy-to-understand pricing, scheduling, and progress tracking
4. **Mobile-First**: Responsive design prioritizing mobile experience for on-the-go users