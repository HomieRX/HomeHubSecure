import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  setupAuth, 
  isAuthenticated, 
  requireRole, 
  requireOwnershipOrAdmin,
  csrfProtection,
  setCSRFToken
} from "./replitAuth";
import {
  insertUserSchema,
  insertMemberProfileSchema,
  insertContractorProfileSchema,
  insertMerchantProfileSchema,
  insertHomeDetailsSchema,
  insertServiceRequestSchema,
  insertWorkOrderSchema,
  insertEstimateSchema,
  insertInvoiceSchema,
  insertDealSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertCalendarEventSchema,
  type MemberProfile,
  type ContractorProfile,
  type MerchantProfile
} from "@shared/schema";

// PII Sanitization Functions for Public Endpoints
function sanitizeMemberProfile(profile: MemberProfile) {
  return {
    id: profile.id,
    nickname: profile.nickname,
    membershipTier: profile.membershipTier,
    loyaltyPoints: profile.loyaltyPoints,
    bio: profile.bio,
    location: profile.location, // General location is OK, but not full address
    avatarUrl: profile.avatarUrl,
    coverImageUrl: profile.coverImageUrl,
    joinedAt: profile.joinedAt
    // PII fields removed: firstName, lastName, email, phone, address, city, state, zipCode
  };
}

function sanitizeContractorProfile(profile: ContractorProfile) {
  return {
    id: profile.id,
    businessName: profile.businessName,
    serviceRadius: profile.serviceRadius,
    hourlyRate: profile.hourlyRate,
    isVerified: profile.isVerified,
    verifiedAt: profile.verifiedAt,
    bio: profile.bio,
    specialties: profile.specialties,
    certifications: profile.certifications,
    yearsExperience: profile.yearsExperience,
    portfolioImages: profile.portfolioImages,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    isActive: profile.isActive,
    availability: profile.availability,
    city: profile.city, // City is OK for general location
    state: profile.state // State is OK for general location
    // PII fields removed: firstName, lastName, phone, email, address, zipCode,
    // licenseNumber, insurancePolicyNumber, bondingProvider, bondingAmount
  };
}

function sanitizeMerchantProfile(profile: MerchantProfile) {
  return {
    id: profile.id,
    businessName: profile.businessName,
    website: profile.website,
    businessType: profile.businessType,
    businessDescription: profile.businessDescription,
    operatingHours: profile.operatingHours,
    serviceArea: profile.serviceArea,
    specialties: profile.specialties,
    acceptedPaymentMethods: profile.acceptedPaymentMethods,
    businessImages: profile.businessImages,
    logoUrl: profile.logoUrl,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    isVerified: profile.isVerified,
    verifiedAt: profile.verifiedAt,
    isActive: profile.isActive,
    city: profile.city, // City is OK for general location
    state: profile.state // State is OK for general location
    // PII fields removed: ownerName, phone, email, address, zipCode,
    // businessLicense, taxId
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  
  // Apply CSRF protection middleware to all routes
  app.use(setCSRFToken);
  app.use(csrfProtection);

  // CSRF token endpoint for frontend
  app.get('/api/csrf-token', (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // Auth endpoint - Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  // User Management Routes (PROTECTED - PII access)
  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const targetId = req.params.id;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(targetId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/by-username/:username", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DEPRECATED: User creation now handled by Replit Auth
  app.post("/api/users", async (req, res) => {
    res.status(410).json({ 
      error: "Direct user creation is deprecated. Please use authentication system." 
    });
  });

  app.put("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const targetId = req.params.id;
      
      // Only allow updating own profile or admin access
      if (currentUser?.id !== targetId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(targetId, validatedData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Member Profile Routes (PROTECTED - PII access)
  app.get("/api/members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await storage.getMemberProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      // Only allow access to own profile or admin access
      if (profile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/members/by-user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const profile = await storage.getMemberProfileByUserId(targetUserId);
      if (!profile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/members", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMemberProfileSchema.parse(req.body);
      
      // Ensure the user is creating their own profile or is admin
      const currentUserId = req.user.claims.sub;
      if (validatedData.userId !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create your own member profile" });
        }
      }
      
      const profile = await storage.createMemberProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid member profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/members/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = insertMemberProfileSchema.partial().parse(req.body);
      const profile = await storage.updateMemberProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid member profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/members/by-tier/:tier", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const members = await storage.getMembersByTier(req.params.tier);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Contractor Profile Routes
  app.get("/api/contractors", async (req, res) => {
    try {
      const filters = {
        isVerified: req.query.verified ? req.query.verified === 'true' : undefined,
        isActive: req.query.active ? req.query.active === 'true' : undefined,
        specialties: req.query.specialties ? String(req.query.specialties).split(',') : undefined,
        location: req.query.location ? String(req.query.location) : undefined
      };
      const contractors = await storage.getContractors(filters);
      
      // Sanitize PII for public access
      const sanitizedContractors = contractors.map(contractor => sanitizeContractorProfile(contractor));
      res.json(sanitizedContractors);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/contractors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await storage.getContractorProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }

      // Only allow access to own profile or admin access
      if (profile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/contractors/by-user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const profile = await storage.getContractorProfileByUserId(targetUserId);
      if (!profile) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contractors", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertContractorProfileSchema.parse(req.body);
      
      // Ensure the user is creating their own profile or is admin
      const currentUserId = req.user.claims.sub;
      if (validatedData.userId !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create your own contractor profile" });
        }
      }
      
      const profile = await storage.createContractorProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid contractor profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/contractors/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = insertContractorProfileSchema.partial().parse(req.body);
      const profile = await storage.updateContractorProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid contractor profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contractors/:id/verify", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { verifiedBy } = req.body;
      if (!verifiedBy) {
        return res.status(400).json({ error: "verifiedBy is required" });
      }
      const profile = await storage.verifyContractor(req.params.id, verifiedBy);
      if (!profile) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Merchant Profile Routes
  app.get("/api/merchants", async (req, res) => {
    try {
      const filters = {
        isVerified: req.query.verified ? req.query.verified === 'true' : undefined,
        isActive: req.query.active ? req.query.active === 'true' : undefined,
        businessType: req.query.businessType ? String(req.query.businessType) : undefined,
        location: req.query.location ? String(req.query.location) : undefined
      };
      const merchants = await storage.getMerchants(filters);
      
      // Sanitize PII for public access
      const sanitizedMerchants = merchants.map(merchant => sanitizeMerchantProfile(merchant));
      res.json(sanitizedMerchants);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/merchants/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await storage.getMerchantProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Merchant profile not found" });
      }

      // Only allow access to own profile or admin access
      if (profile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/merchants/by-user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const profile = await storage.getMerchantProfileByUserId(targetUserId);
      if (!profile) {
        return res.status(404).json({ error: "Merchant profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/merchants", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMerchantProfileSchema.parse(req.body);
      
      // Ensure the user is creating their own profile or is admin
      const currentUserId = req.user.claims.sub;
      if (validatedData.userId !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create your own merchant profile" });
        }
      }
      
      const profile = await storage.createMerchantProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid merchant profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/merchants/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = insertMerchantProfileSchema.partial().parse(req.body);
      const profile = await storage.updateMerchantProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Merchant profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid merchant profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Home Details Routes
  app.get("/api/home-details/:id", async (req, res) => {
    try {
      const details = await storage.getHomeDetails(req.params.id);
      if (!details) {
        return res.status(404).json({ error: "Home details not found" });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/home-details/by-profile/:profileId", async (req, res) => {
    try {
      const details = await storage.getHomeDetailsByProfileId(req.params.profileId);
      if (!details) {
        return res.status(404).json({ error: "Home details not found" });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/home-details", async (req, res) => {
    try {
      const validatedData = insertHomeDetailsSchema.parse(req.body);
      const details = await storage.createHomeDetails(validatedData);
      res.status(201).json(details);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid home details data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/home-details/:id", async (req, res) => {
    try {
      const validatedData = insertHomeDetailsSchema.partial().parse(req.body);
      const details = await storage.updateHomeDetails(req.params.id, validatedData);
      if (!details) {
        return res.status(404).json({ error: "Home details not found" });
      }
      res.json(details);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid home details data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Service Request Routes
  app.get("/api/service-requests/:id", async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/service-requests/by-member/:memberId", async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByMember(req.params.memberId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/service-requests/by-manager/:homeManagerId", async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByManager(req.params.homeManagerId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/service-requests", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertServiceRequestSchema.parse(req.body);
      
      // Ensure user is creating request for their own member profile or is admin
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // For non-admins, check if they're creating for their own member profile
      if (currentUser.role !== "admin") {
        const memberProfile = await storage.getMemberProfileByUserId(currentUserId);
        if (!memberProfile || validatedData.memberId !== memberProfile.id) {
          return res.status(403).json({ error: "Can only create service requests for your own account" });
        }
      }
      
      const request = await storage.createServiceRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid service request data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/service-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertServiceRequestSchema.partial().parse(req.body);
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // Check ownership or admin permissions
      const serviceRequest = await storage.getServiceRequest(req.params.id);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      if (currentUser.role !== "admin") {
        const memberProfile = await storage.getMemberProfileByUserId(currentUserId);
        if (!memberProfile || serviceRequest.memberId !== memberProfile.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const request = await storage.updateServiceRequest(req.params.id, validatedData);
      res.json(request);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid service request data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/service-requests/:id/assign", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const { homeManagerId } = req.body;
      if (!homeManagerId) {
        return res.status(400).json({ error: "homeManagerId is required" });
      }
      const request = await storage.assignServiceRequest(req.params.id, homeManagerId);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Work Order Routes
  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-orders/by-service-request/:serviceRequestId", async (req, res) => {
    try {
      const workOrders = await storage.getWorkOrdersByServiceRequest(req.params.serviceRequestId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-orders/by-manager/:homeManagerId", async (req, res) => {
    try {
      const workOrders = await storage.getWorkOrdersByManager(req.params.homeManagerId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-orders/by-contractor/:contractorId", async (req, res) => {
    try {
      const workOrders = await storage.getWorkOrdersByContractor(req.params.contractorId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/work-orders", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid work order data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/work-orders/:id", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid work order data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/work-orders/:id/complete", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const { completionNotes } = req.body;
      if (!completionNotes) {
        return res.status(400).json({ error: "completionNotes is required" });
      }
      const workOrder = await storage.completeWorkOrder(req.params.id, completionNotes);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Estimate Routes
  app.get("/api/estimates/:id", async (req, res) => {
    try {
      const estimate = await storage.getEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/estimates/by-service-request/:serviceRequestId", async (req, res) => {
    try {
      const estimates = await storage.getEstimatesByServiceRequest(req.params.serviceRequestId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/estimates/by-contractor/:contractorId", async (req, res) => {
    try {
      const estimates = await storage.getEstimatesByContractor(req.params.contractorId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/estimates", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = insertEstimateSchema.parse(req.body);
      const estimate = await storage.createEstimate(validatedData);
      res.status(201).json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid estimate data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/estimates/:id", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = insertEstimateSchema.partial().parse(req.body);
      const estimate = await storage.updateEstimate(req.params.id, validatedData);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid estimate data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/estimates/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const estimate = await storage.approveEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/estimates/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const estimate = await storage.rejectEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Invoice Routes
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/invoices/by-member/:memberId", async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByMember(req.params.memberId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/invoices/by-work-order/:workOrderId", async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByWorkOrder(req.params.workOrderId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/invoices", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid invoice data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/invoices/:id", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid invoice data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/invoices/:id/pay", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentMethod, transactionId } = req.body;
      if (!paymentMethod || !transactionId) {
        return res.status(400).json({ error: "paymentMethod and transactionId are required" });
      }
      const invoice = await storage.payInvoice(req.params.id, paymentMethod, transactionId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Loyalty Points Routes
  app.get("/api/loyalty-points/balance/:memberId", async (req, res) => {
    try {
      const balance = await storage.getLoyaltyPointBalance(req.params.memberId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/loyalty-points/transactions/:memberId", async (req, res) => {
    try {
      const transactions = await storage.getLoyaltyPointTransactions(req.params.memberId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/loyalty-points/add", async (req, res) => {
    try {
      const { memberId, points, description, referenceId, referenceType } = req.body;
      if (!memberId || !points || !description) {
        return res.status(400).json({ error: "memberId, points, and description are required" });
      }
      const transaction = await storage.addLoyaltyPoints(memberId, points, description, referenceId, referenceType);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/loyalty-points/spend", async (req, res) => {
    try {
      const { memberId, points, description, referenceId, referenceType } = req.body;
      if (!memberId || !points || !description) {
        return res.status(400).json({ error: "memberId, points, and description are required" });
      }
      const transaction = await storage.spendLoyaltyPoints(memberId, points, description, referenceId, referenceType);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Deal Routes
  app.get("/api/deals", async (req, res) => {
    try {
      const filters = {
        category: req.query.category ? String(req.query.category) : undefined,
        membershipRequired: req.query.membershipRequired ? String(req.query.membershipRequired) : undefined,
        isExclusive: req.query.exclusive ? req.query.exclusive === 'true' : undefined
      };
      const deals = await storage.getActiveDeals(filters);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/deals/by-merchant/:merchantId", async (req, res) => {
    try {
      const deals = await storage.getDealsByMerchant(req.params.merchantId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/deals", isAuthenticated, requireRole(["admin", "merchant"]), async (req: any, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid deal data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/deals/:id", async (req, res) => {
    try {
      const validatedData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(req.params.id, validatedData);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid deal data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/deals/:dealId/redeem", async (req, res) => {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: "memberId is required" });
      }
      const redemption = await storage.redeemDeal(req.params.dealId, memberId);
      res.status(201).json(redemption);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message Routes
  app.get("/api/messages/:id", async (req, res) => {
    try {
      const message = await storage.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/messages/by-user/:userId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByUser(req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/messages/conversation/:senderId/:receiverId", async (req, res) => {
    try {
      const messages = await storage.getConversation(req.params.senderId, req.params.receiverId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Ensure user is sending message from their own account
      const currentUserId = req.user.claims.sub;
      if (validatedData.senderId !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only send messages from your own account" });
        }
      }
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notification Routes
  app.get("/api/notifications/:id", async (req, res) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/notifications/by-user/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid notification data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/read-all/:userId", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Calendar Event Routes
  app.get("/api/calendar-events/:id", async (req, res) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/calendar-events/by-user/:userId", async (req, res) => {
    try {
      const events = await storage.getCalendarEventsByUser(req.params.userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid calendar event data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/calendar-events/:id", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json(event);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid calendar event data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCalendarEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Community Routes
  app.get("/api/community/posts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;
      const offset = req.query.offset ? parseInt(String(req.query.offset)) : undefined;
      const posts = await storage.getCommunityPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/community/posts/:id", async (req, res) => {
    try {
      const post = await storage.getCommunityPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Community post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/community/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { authorId, content, images, tags } = req.body;
      if (!authorId || !content) {
        return res.status(400).json({ error: "authorId and content are required" });
      }
      
      // Ensure user is creating post from their own account
      const currentUserId = req.user.claims.sub;
      if (authorId !== currentUserId) {
        const currentUser = await storage.getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create posts from your own account" });
        }
      }
      const post = await storage.createCommunityPost(authorId, content, images, tags);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/community/groups", async (req, res) => {
    try {
      const groups = await storage.getCommunityGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/community/groups/:id", async (req, res) => {
    try {
      const group = await storage.getCommunityGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Community group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/community/groups", async (req, res) => {
    try {
      const { name, description, category, createdBy } = req.body;
      if (!name || !description || !category || !createdBy) {
        return res.status(400).json({ error: "name, description, category, and createdBy are required" });
      }
      const group = await storage.createCommunityGroup(name, description, category, createdBy);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}