# HomeHub - Digital Home Services Platform

## Overview

HomeHub is a comprehensive digital platform that connects homeowners with trusted contractors and home service professionals. The platform provides a secure client and community portal featuring membership tiers, service management, contractor marketplace, and preventive maintenance scheduling. Built as a professional dashboard interface inspired by Linear, Notion, and Stripe, HomeHub serves as the digital headquarters for home services management with enterprise-grade security and workflow efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design system supporting dark mode by default
- **State Management**: React Query (TanStack Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular component architecture with reusable UI components and service-specific components

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules for type safety and modern JavaScript features
- **API Design**: RESTful API architecture with middleware for logging, error handling, and request processing
- **Storage Layer**: Abstracted storage interface supporting both in-memory and database implementations
- **Session Management**: Express sessions with configurable storage backends

### Database & Schema Design
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Strategy**: Shared schema definitions between client and server for type consistency
- **Migrations**: Drizzle Kit for schema migrations and database versioning

### Service Architecture
The platform implements a service-oriented architecture with distinct service types:

- **FixiT!**: Diagnostic and repair services with hourly billing
- **PreventiT!**: Seasonal preventive maintenance with time-based sessions
- **HandleiT!**: Contractor marketplace with escrow payment protection
- **CheckiT!**: Home inspection and health monitoring services
- **LoyalizeiT!**: Rewards and loyalty program with points system

### Membership & Access Control
- **Tier System**: Four membership levels (HomeHUB, HomePRO, HomeHERO, HomeGURU) with progressive feature access
- **RBAC**: Role-based access control with server-side enforcement
- **Scoping**: Geographic and tenant-based data isolation (ZIP, county, tenant_id)
- **Quotas**: Configurable service limits and concurrency controls per membership tier

### Scheduling & Workflow Engine
- **Slot Management**: Time-based scheduling system with capacity management
- **State Machines**: Defined workflow states for each service type with automated transitions
- **Seasonal Controls**: Configurable service windows (e.g., PreventiT! limited to Feb-Mar and Jul-Aug)
- **Auto-throttling**: Dynamic capacity management based on provider utilization

### Payment & Financial Systems
- **Payment Processing**: Stripe integration for subscription billing and service payments
- **Escrow System**: Secure payment holding for HandleiT! contractor services with milestone-based releases
- **Points Economy**: LoyalizeiT! rewards system with append-only ledger for point tracking
- **Billing Models**: Multiple pricing strategies (hourly, session-based, subscription) based on service type

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database for scalable data storage
- **Payment Processing**: Stripe for subscription management, payment processing, and escrow services
- **Email Services**: SendGrid for transactional emails and notifications

### Development & Build Tools
- **Package Management**: npm with lock file for dependency consistency
- **Build System**: Vite for fast development and optimized production builds
- **Code Quality**: TypeScript for type safety and ESBuild for production bundling
- **Deployment**: Replit environment with custom dev banner integration

### UI & Design Dependencies
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Forms**: React Hook Form with Zod resolvers for form validation
- **Animations**: Class Variance Authority for component variants and transitions

### Monitoring & Development
- **Error Handling**: Runtime error overlay for development environment
- **Logging**: Custom logging middleware for API request tracking
- **Session Storage**: Connect-pg-simple for PostgreSQL session storage
- **Development Tools**: Cartographer for Replit environment integration

## Recent Changes

### December 17, 2025 - UI Mock Data Replacement Completed
- **Mock Data Replacement**: Successfully replaced placeholder data with React Query hooks across 6+ major components (Contractors, Merchants, Community, Groups, Timeline, ContractorsDirectory)
- **Form Validation**: Implemented comprehensive form validation using Zod schemas and react-hook-form with shadcn Form components for community features (group creation, post creation)
- **Optimistic Updates**: Added optimistic updates with proper rollback mechanisms for likes, group membership, and content creation
- **Loading States**: Implemented skeleton loaders and comprehensive loading indicators throughout the application
- **Error Handling**: Added retry functionality, toast notifications, and graceful error recovery across all updated components
- **TypeScript Fixes**: Resolved 90+ LSP diagnostic errors to ensure proper compilation and hot module reload functionality

### Technical Implementation Details
- **React Query Integration**: All components now use real API endpoints with proper caching, invalidation, and stale time configuration
- **Form Architecture**: Community forms use insertCommunityGroupSchema and insertCommunityPostSchema with client-side validation
- **Security Considerations**: Identified areas for production hardening including auth integration and server-side user identity derivation
- **Performance**: Added useMemo for filtering, efficient re-renders, and proper query key management for cache optimization

### Production Readiness Notes
- Form validation and React Query integration complete and functional
- TypeScript compilation fully resolved with no LSP diagnostics
- Optimistic updates working with proper rollback mechanisms
- Authentication integration needed for production deployment
- Server-side user identity derivation required for security hardening