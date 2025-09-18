import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import express from "express";
import { getStorage } from "./storage";
import { 
  setupAuth, 
  isAuthenticated, 
  requireRole, 
  requireOwnershipOrAdmin,
  csrfProtection,
  setCSRFToken,
  upsertUser
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
  insertNotificationSettingsSchema,
  insertCalendarEventSchema,
  insertBadgeSchema,
  insertRankSchema,
  insertAchievementSchema,
  insertMaintenanceItemSchema,
  type MemberProfile,
  type ContractorProfile,
  type MerchantProfile,
  type NotificationSettings,
  type InsertNotificationSettings,
  type Forum,
  type ForumTopic,
  type ForumPost,
  type ForumPostVote
} from "@shared/schema";
import { 
  ServiceWorkflowManager, 
  SERVICE_CONFIGS, 
  MEMBERSHIP_BENEFITS,
  type ServiceType 
} from "./serviceWorkflow";
import { 
  uploadService, 
  uploadMiddleware, 
  UploadError,
  type FileUploadRequest 
} from "./uploads";
import { 
  ObjectStorageService, 
  ObjectNotFoundError 
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { 
  SchedulingService, 
  type AvailabilityRequest,
  type SlotBookingRequest,
  type AdminSlotOverrideRequest
} from "./schedulingService";

// Stripe Configuration - javascript_stripe integration
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

console.log(stripe ? '✅ Stripe initialized' : '⚠️  Stripe API key not configured - payment features disabled');

// SendGrid Configuration - javascript_sendgrid integration  
import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize scheduling service
const schedulingService = new SchedulingService();

// Email notification service
async function sendPaymentNotificationEmail(
  to: string,
  invoiceData: any,
  paymentData: any
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, skipping email notification');
    return false;
  }
  
  try {
    await mailService.send({
      to,
      from: 'noreply@homehub.app', // Configure this with your verified sender
      subject: `Payment Confirmation - Invoice ${invoiceData.invoiceNumber}`,
      html: `
        <h2>Payment Confirmation</h2>
        <p>Dear Customer,</p>
        <p>Your payment for invoice #${invoiceData.invoiceNumber} has been successfully processed.</p>
        <ul>
          <li><strong>Amount:</strong> $${invoiceData.total}</li>
          <li><strong>Payment Method:</strong> ${paymentData.paymentMethod}</li>
          <li><strong>Transaction ID:</strong> ${paymentData.transactionId}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>The HomeHub Team</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

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
  
  // Initialize comprehensive seed data
  try {
    const storageInstance = await getStorage();
    await storageInstance.seedComprehensiveData();
  } catch (error) {
    console.error("⚠️ Failed to seed comprehensive data:", error);
  }
  
  // Raw body parsing for Stripe webhooks (must be before other body parsers)
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  
  // Apply CSRF protection middleware to all routes (except webhooks)
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/webhooks/')) {
      return next(); // Skip CSRF for webhooks
    }
    setCSRFToken(req, res, next);
  });
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/webhooks/')) {
      return next(); // Skip CSRF for webhooks
    }
    csrfProtection(req, res, next);
  });

  // CSRF token endpoint for frontend
  app.get('/api/csrf-token', (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // Auth endpoint - Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`[DEBUG] Looking for user ID: "${userId}" (type: ${typeof userId})`);
      let user = await (await getStorage()).getUser(userId);
      console.log(`[DEBUG] Initial getUser result: ${user ? 'found' : 'not found'}`);
      
      // If user doesn't exist, create them from the authenticated claims
      if (!user) {
        console.log(`Creating new user from auth claims: ${userId}`);
        const claims = req.user.claims;
        console.log(`[DEBUG] Claims sub: "${claims.sub}" (type: ${typeof claims.sub})`);
        await upsertUser(claims);
        user = await (await getStorage()).getUser(userId);
        console.log(`[DEBUG] After upsertUser, getUser result: ${user ? 'found' : 'not found'}`);
        
        // Double-check: try converting userId to string
        if (!user && typeof userId === 'number') {
          const userIdStr = String(userId);
          console.log(`[DEBUG] Trying string conversion: "${userIdStr}"`);
          user = await (await getStorage()).getUser(userIdStr);
          console.log(`[DEBUG] String conversion result: ${user ? 'found' : 'not found'}`);
        }
      }
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Sanitize user data - remove sensitive fields
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
        // Exclude: username, password (even if null)
      };
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  // User Management Routes (PROTECTED - PII access)
  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetId = req.params.id;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await (await getStorage()).getUser(targetId);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const user = await (await getStorage()).getUserByUsername(req.params.username);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetId = req.params.id;
      
      // Only allow updating own profile or admin access
      if (currentUser?.id !== targetId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const validatedData = UserProfileUpdateSchema.parse(req.body);
      const user = await (await getStorage()).updateUser(targetId, validatedData);
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

  // Notification Settings Routes (PROTECTED)
  app.get("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let settings = await (await getStorage()).getNotificationSettings(userId);
      
      // If no settings exist, create default settings
      if (!settings) {
        const defaultSettings: InsertNotificationSettings = { userId };
        settings = await (await getStorage()).createNotificationSettings(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Create a partial schema for updates (all fields except userId are optional)
      const updateSchema = insertNotificationSettingsSchema.omit({ userId: true }).partial();
      const validatedData = updateSchema.parse(req.body);
      
      // Check if settings exist, create if not
      let existingSettings = await (await getStorage()).getNotificationSettings(userId);
      
      if (!existingSettings) {
        // Create new settings with the provided data
        const createData: InsertNotificationSettings = { userId, ...validatedData };
        existingSettings = await (await getStorage()).createNotificationSettings(createData);
      } else {
        // Update existing settings
        existingSettings = await (await getStorage()).updateNotificationSettings(userId, validatedData);
      }
      
      if (!existingSettings) {
        return res.status(404).json({ error: "Failed to update notification settings" });
      }
      
      res.json(existingSettings);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid notification settings data", details: error.errors });
      }
      console.error("Error updating notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Member Profile Routes (PROTECTED - PII access)
  app.get("/api/members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await (await getStorage()).getMemberProfile(req.params.id);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const profile = await (await getStorage()).getMemberProfileByUserId(targetUserId);
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
        const currentUser = await (await getStorage()).getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create your own member profile" });
        }
      }
      
      // Process data for storage - the schema validation passes but storage needs exact types
      const processedData = {
        ...validatedData,
        // Convert any date strings to Date objects if needed
        // No additional processing needed for basic fields
      };
      
      const profile = await (await getStorage()).createMemberProfile(processedData);
      res.status(201).json(profile);
    } catch (error: any) {
      console.error("Member creation error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid member profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/members/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = MemberProfileUpdateSchema.parse(req.body);
      const profile = await (await getStorage()).updateMemberProfile(req.params.id, validatedData);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const members = await (await getStorage()).getMembersByTier(req.params.tier);
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
      const contractors = await (await getStorage()).getContractors(filters);
      
      // Sanitize PII for public access
      const sanitizedContractors = contractors.map(contractor => sanitizeContractorProfile(contractor));
      res.json(sanitizedContractors);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/contractors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await (await getStorage()).getContractorProfile(req.params.id);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const profile = await (await getStorage()).getContractorProfileByUserId(targetUserId);
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
        const currentUser = await (await getStorage()).getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create your own contractor profile" });
        }
      }
      
      // Convert string dates to Date objects for database compatibility
      const processedData = {
        ...validatedData,
        licenseExpiryDate: validatedData.licenseExpiryDate ? new Date(validatedData.licenseExpiryDate) : undefined
      };
      
      const profile = await (await getStorage()).createContractorProfile(processedData);
      res.status(201).json(profile);
    } catch (error: any) {
      console.error("Contractor creation error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid contractor profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/contractors/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = ContractorProfileUpdateSchema.parse(req.body);
      const profile = await (await getStorage()).updateContractorProfile(req.params.id, validatedData);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { verifiedBy } = req.body;
      if (!verifiedBy) {
        return res.status(400).json({ error: "verifiedBy is required" });
      }
      const profile = await (await getStorage()).verifyContractor(req.params.id, verifiedBy);
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
      const merchants = await (await getStorage()).getMerchants(filters);
      
      // Sanitize PII for public access
      const sanitizedMerchants = merchants.map(merchant => sanitizeMerchantProfile(merchant));
      res.json(sanitizedMerchants);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/merchants/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await (await getStorage()).getMerchantProfile(req.params.id);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own profile or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const profile = await (await getStorage()).getMerchantProfileByUserId(targetUserId);
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
        const currentUser = await (await getStorage()).getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create your own merchant profile" });
        }
      }
      
      const profile = await (await getStorage()).createMerchantProfile(validatedData);
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
      const validatedData = MerchantProfileUpdateSchema.parse(req.body);
      const profile = await (await getStorage()).updateMerchantProfile(req.params.id, validatedData);
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
  app.get("/api/home-details/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const details = await (await getStorage()).getHomeDetails(req.params.id);
      if (!details) {
        return res.status(404).json({ error: "Home details not found" });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/home-details/by-profile/:profileId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const details = await (await getStorage()).getHomeDetailsByProfileId(req.params.profileId);
      if (!details) {
        return res.status(404).json({ error: "Home details not found" });
      }

      // Check if user owns this profile or is admin
      const profile = await (await getStorage()).getMemberProfile(req.params.profileId);
      if (profile && profile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/home-details", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertHomeDetailsSchema.parse(req.body);
      const details = await (await getStorage()).createHomeDetails(validatedData);
      res.status(201).json(details);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid home details data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/home-details/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = insertHomeDetailsSchema.partial().parse(req.body);
      const details = await (await getStorage()).updateHomeDetails(req.params.id, validatedData);
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
  app.get("/api/service-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const request = await (await getStorage()).getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Check if user is member who created this request, assigned contractor, or admin
      const memberProfile = await (await getStorage()).getMemberProfile(request.memberId);
      const isOwner = memberProfile && memberProfile.userId === currentUser.id;
      const isAssignedContractor = request.assignedContractorId && 
        await (await getStorage()).getContractorProfile(request.assignedContractorId).then(cp => cp?.userId === currentUser.id);
      
      if (!isOwner && !isAssignedContractor && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/service-requests/by-member/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user owns this member profile or is admin
      const memberProfile = await (await getStorage()).getMemberProfile(req.params.memberId);
      if (!memberProfile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      
      if (memberProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const requests = await (await getStorage()).getServiceRequestsByMember(req.params.memberId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/service-requests/by-manager/:homeManagerId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user is the home manager or admin
      if (req.params.homeManagerId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const requests = await (await getStorage()).getServiceRequestsByManager(req.params.homeManagerId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/service-requests", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = ServiceRequestCreateSchema.parse(req.body);
      
      // Ensure user is creating request for their own member profile or is admin
      const currentUserId = req.user.claims.sub;
      const currentUser = await (await getStorage()).getUser(currentUserId);
      
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      let memberProfile;
      // For non-admins, check if they're creating for their own member profile
      if (currentUser.role !== "admin") {
        memberProfile = await (await getStorage()).getMemberProfileByUserId(currentUserId);
        if (!memberProfile || validatedData.memberId !== memberProfile.id) {
          return res.status(403).json({ error: "Can only create service requests for your own account" });
        }
      } else {
        // For admins, fetch the target member profile
        memberProfile = await (await getStorage()).getMemberProfile(validatedData.memberId);
        if (!memberProfile) {
          return res.status(404).json({ error: "Member profile not found" });
        }
      }

      // Use ServiceWorkflowManager for validation and processing
      if (!validatedData.serviceType) {
        return res.status(400).json({ error: "Service type is required" });
      }

      // Validate service request using ServiceWorkflowManager
      const validation = ServiceWorkflowManager.validateServiceRequest(
        validatedData.serviceType as ServiceType,
        memberProfile.membershipTier,
        validatedData
      );

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: "Service request validation failed", 
          details: validation.errors 
        });
      }

      // Process service request with ServiceWorkflowManager enhancements
      const processedData = ServiceWorkflowManager.processServiceRequest(
        validatedData.serviceType as ServiceType,
        validatedData,
        memberProfile.membershipTier
      );
      
      const request = await (await getStorage()).createServiceRequest(processedData);
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
      const currentUser = await (await getStorage()).getUser(currentUserId);
      
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // Check ownership or admin permissions
      const serviceRequest = await (await getStorage()).getServiceRequest(req.params.id);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }
      
      if (currentUser.role !== "admin") {
        const memberProfile = await (await getStorage()).getMemberProfileByUserId(currentUserId);
        if (!memberProfile || serviceRequest.memberId !== memberProfile.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const request = await (await getStorage()).updateServiceRequest(req.params.id, validatedData);
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
      const request = await (await getStorage()).assignServiceRequest(req.params.id, homeManagerId);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Service Workflow Management Routes (Enhanced with ServiceWorkflowManager)
  
  // Get service configurations and available service types
  app.get("/api/services/types", async (req, res) => {
    try {
      const serviceTypes = Object.keys(SERVICE_CONFIGS).map(serviceType => ({
        type: serviceType,
        config: ServiceWorkflowManager.getServiceConfig(serviceType as ServiceType)
      }));
      res.json(serviceTypes);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get membership tier benefits
  app.get("/api/services/membership-benefits", async (req, res) => {
    try {
      res.json(MEMBERSHIP_BENEFITS);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get available services for a specific membership tier
  app.get("/api/services/available/:membershipTier", async (req, res) => {
    try {
      const { membershipTier } = req.params;
      if (!Object.keys(MEMBERSHIP_BENEFITS).includes(membershipTier)) {
        return res.status(400).json({ error: "Invalid membership tier" });
      }
      
      const availableServices = ServiceWorkflowManager.getAvailableServices(membershipTier);
      const serviceDetails = availableServices.map(serviceType => ({
        type: serviceType,
        config: ServiceWorkflowManager.getServiceConfig(serviceType),
        isCurrentlyAvailable: ServiceWorkflowManager.isServiceAvailable(serviceType)
      }));
      
      res.json(serviceDetails);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check service availability (seasonal services)
  app.get("/api/services/availability", async (req, res) => {
    try {
      const { serviceType } = req.query;
      
      if (serviceType) {
        // Check specific service type
        if (!Object.keys(SERVICE_CONFIGS).includes(serviceType as string)) {
          return res.status(400).json({ error: "Invalid service type" });
        }
        
        const isAvailable = ServiceWorkflowManager.isServiceAvailable(serviceType as ServiceType);
        const config = ServiceWorkflowManager.getServiceConfig(serviceType as ServiceType);
        
        res.json({
          serviceType,
          isAvailable,
          isSeasonalService: config.isSeasonalService,
          seasonalWindows: config.seasonalWindows || null
        });
      } else {
        // Check all service types
        const availability = Object.keys(SERVICE_CONFIGS).map(type => {
          const serviceType = type as ServiceType;
          const config = ServiceWorkflowManager.getServiceConfig(serviceType);
          return {
            serviceType: type,
            isAvailable: ServiceWorkflowManager.isServiceAvailable(serviceType),
            isSeasonalService: config.isSeasonalService,
            seasonalWindows: config.seasonalWindows || null
          };
        });
        
        res.json(availability);
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Calculate service pricing
  app.post("/api/services/pricing", isAuthenticated, async (req: any, res) => {
    try {
      const { serviceType, membershipTier, estimatedDuration, baseRate } = req.body;
      
      if (!serviceType || !membershipTier || !estimatedDuration) {
        return res.status(400).json({ 
          error: "serviceType, membershipTier, and estimatedDuration are required" 
        });
      }
      
      if (!Object.keys(SERVICE_CONFIGS).includes(serviceType)) {
        return res.status(400).json({ error: "Invalid service type" });
      }
      
      if (!Object.keys(MEMBERSHIP_BENEFITS).includes(membershipTier)) {
        return res.status(400).json({ error: "Invalid membership tier" });
      }
      
      const pricing = ServiceWorkflowManager.calculateServicePricing(
        serviceType as ServiceType,
        membershipTier,
        parseInt(estimatedDuration),
        baseRate ? parseFloat(baseRate) : 75
      );
      
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Validate service request before creation
  app.post("/api/services/validate", isAuthenticated, async (req: any, res) => {
    try {
      const { serviceType, membershipTier, requestData } = req.body;
      
      if (!serviceType || !membershipTier) {
        return res.status(400).json({ 
          error: "serviceType and membershipTier are required" 
        });
      }
      
      if (!Object.keys(SERVICE_CONFIGS).includes(serviceType)) {
        return res.status(400).json({ error: "Invalid service type" });
      }
      
      if (!Object.keys(MEMBERSHIP_BENEFITS).includes(membershipTier)) {
        return res.status(400).json({ error: "Invalid membership tier" });
      }
      
      const validation = ServiceWorkflowManager.validateServiceRequest(
        serviceType as ServiceType,
        membershipTier,
        requestData || {}
      );
      
      res.json(validation);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get service workflow configuration for a specific service type
  app.get("/api/services/config/:serviceType", async (req, res) => {
    try {
      const { serviceType } = req.params;
      
      if (!Object.keys(SERVICE_CONFIGS).includes(serviceType)) {
        return res.status(404).json({ error: "Service type not found" });
      }
      
      const config = ServiceWorkflowManager.getServiceConfig(serviceType as ServiceType);
      const isAvailable = ServiceWorkflowManager.isServiceAvailable(serviceType as ServiceType);
      
      res.json({
        serviceType,
        config,
        isCurrentlyAvailable: isAvailable
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Work Order Routes
  app.get("/api/work-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const workOrder = await (await getStorage()).getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }

      // Check if user is the contractor, service requester, or admin
      const contractorProfile = await (await getStorage()).getContractorProfile(workOrder.contractorId);
      const serviceRequest = await (await getStorage()).getServiceRequest(workOrder.serviceRequestId);
      const memberProfile = serviceRequest ? await (await getStorage()).getMemberProfile(serviceRequest.memberId) : null;
      
      const isContractor = contractorProfile?.userId === currentUser.id;
      const isServiceRequester = memberProfile?.userId === currentUser.id;
      
      if (!isContractor && !isServiceRequester && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-orders/by-service-request/:serviceRequestId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const serviceRequest = await (await getStorage()).getServiceRequest(req.params.serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Check if user is the service requester, assigned contractor, or admin
      const memberProfile = await (await getStorage()).getMemberProfile(serviceRequest.memberId);
      const isServiceRequester = memberProfile?.userId === currentUser.id;
      const isAssignedContractor = serviceRequest.assignedContractorId && 
        await (await getStorage()).getContractorProfile(serviceRequest.assignedContractorId).then(cp => cp?.userId === currentUser.id);
      
      if (!isServiceRequester && !isAssignedContractor && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const workOrders = await (await getStorage()).getWorkOrdersByServiceRequest(req.params.serviceRequestId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-orders/by-manager/:homeManagerId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user is the home manager or admin
      if (req.params.homeManagerId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied - can only view your own managed work orders" });
      }

      const workOrders = await (await getStorage()).getWorkOrdersByManager(req.params.homeManagerId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/work-orders/by-contractor/:contractorId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user owns this contractor profile or is admin
      const contractorProfile = await (await getStorage()).getContractorProfile(req.params.contractorId);
      if (!contractorProfile) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }
      
      if (contractorProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const workOrders = await (await getStorage()).getWorkOrdersByContractor(req.params.contractorId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/work-orders", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = WorkOrderCreateSchema.parse(req.body);
      const workOrder = await (await getStorage()).createWorkOrder(validatedData);
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
      const workOrder = await (await getStorage()).updateWorkOrder(req.params.id, validatedData);
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
      const workOrder = await (await getStorage()).completeWorkOrder(req.params.id, completionNotes);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Estimate Routes
  app.get("/api/estimates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const estimate = await (await getStorage()).getEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      // Check if user is the contractor who created the estimate, the service requester, or admin
      const contractorProfile = await (await getStorage()).getContractorProfile(estimate.contractorId);
      const serviceRequest = await (await getStorage()).getServiceRequest(estimate.serviceRequestId);
      const memberProfile = serviceRequest ? await (await getStorage()).getMemberProfile(serviceRequest.memberId) : null;
      
      const isContractor = contractorProfile?.userId === currentUser.id;
      const isServiceRequester = memberProfile?.userId === currentUser.id;
      
      if (!isContractor && !isServiceRequester && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(estimate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/estimates/by-service-request/:serviceRequestId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const serviceRequest = await (await getStorage()).getServiceRequest(req.params.serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Check if user is the service requester, assigned contractor, or admin
      const memberProfile = await (await getStorage()).getMemberProfile(serviceRequest.memberId);
      const isServiceRequester = memberProfile?.userId === currentUser.id;
      const isAssignedContractor = serviceRequest.assignedContractorId && 
        await (await getStorage()).getContractorProfile(serviceRequest.assignedContractorId).then(cp => cp?.userId === currentUser.id);
      
      if (!isServiceRequester && !isAssignedContractor && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const estimates = await (await getStorage()).getEstimatesByServiceRequest(req.params.serviceRequestId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/estimates/by-contractor/:contractorId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user owns this contractor profile or is admin
      const contractorProfile = await (await getStorage()).getContractorProfile(req.params.contractorId);
      if (!contractorProfile) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }
      
      if (contractorProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const estimates = await (await getStorage()).getEstimatesByContractor(req.params.contractorId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/estimates", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = EstimateCreateSchema.parse(req.body);
      const estimate = await (await getStorage()).createEstimate(validatedData);
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
      const validatedData = EstimateUpdateSchema.parse(req.body);
      const estimate = await (await getStorage()).updateEstimate(req.params.id, validatedData);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const estimate = await (await getStorage()).getEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      // Only the service requester or admin can approve estimates
      const serviceRequest = await (await getStorage()).getServiceRequest(estimate.serviceRequestId);
      const memberProfile = serviceRequest ? await (await getStorage()).getMemberProfile(serviceRequest.memberId) : null;
      
      if (memberProfile?.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Only the service requester can approve estimates" });
      }

      const approvedEstimate = await (await getStorage()).approveEstimate(req.params.id);
      res.json(approvedEstimate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/estimates/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const estimate = await (await getStorage()).getEstimate(req.params.id);
      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }

      // Only the service requester or admin can reject estimates
      const serviceRequest = await (await getStorage()).getServiceRequest(estimate.serviceRequestId);
      const memberProfile = serviceRequest ? await (await getStorage()).getMemberProfile(serviceRequest.memberId) : null;
      
      if (memberProfile?.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Only the service requester can reject estimates" });
      }

      const rejectedEstimate = await (await getStorage()).rejectEstimate(req.params.id);
      res.json(rejectedEstimate);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Invoice Routes
  app.get("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const invoice = await (await getStorage()).getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Check if user is the member being invoiced, the contractor who created it, or admin
      const memberProfile = await (await getStorage()).getMemberProfile(invoice.memberId);
      const workOrder = await (await getStorage()).getWorkOrder(invoice.workOrderId);
      const contractorProfile = workOrder ? await (await getStorage()).getContractorProfile(workOrder.contractorId) : null;
      
      const isMember = memberProfile?.userId === currentUser.id;
      const isContractor = contractorProfile?.userId === currentUser.id;
      
      if (!isMember && !isContractor && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/invoices/by-member/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user owns this member profile or is admin
      const memberProfile = await (await getStorage()).getMemberProfile(req.params.memberId);
      if (!memberProfile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      
      if (memberProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const invoices = await (await getStorage()).getInvoicesByMember(req.params.memberId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/invoices/by-work-order/:workOrderId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const workOrder = await (await getStorage()).getWorkOrder(req.params.workOrderId);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }

      // Check if user is the contractor or service requester, or admin
      const contractorProfile = await (await getStorage()).getContractorProfile(workOrder.contractorId);
      const serviceRequest = await (await getStorage()).getServiceRequest(workOrder.serviceRequestId);
      const memberProfile = serviceRequest ? await (await getStorage()).getMemberProfile(serviceRequest.memberId) : null;
      
      const isContractor = contractorProfile?.userId === currentUser.id;
      const isServiceRequester = memberProfile?.userId === currentUser.id;
      
      if (!isContractor && !isServiceRequester && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const invoices = await (await getStorage()).getInvoicesByWorkOrder(req.params.workOrderId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/invoices", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const validatedData = InvoiceCreateSchema.parse(req.body);
      const invoice = await (await getStorage()).createInvoice(validatedData);
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
      const validatedData = InvoiceUpdateSchema.parse(req.body);
      const invoice = await (await getStorage()).updateInvoice(req.params.id, validatedData);
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

  // Stripe Payment Intent Creation Endpoint
  app.post("/api/payments/intent", isAuthenticated, async (req: any, res) => {
    try {
      // Validate Stripe configuration
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { invoiceId } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ error: "invoiceId is required" });
      }

      const invoice = await (await getStorage()).getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Verify user has access to this invoice
      const memberProfile = await (await getStorage()).getMemberProfile(invoice.memberId);
      if (memberProfile?.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied to this invoice" });
      }

      // Verify invoice is in payable status
      if (invoice.status !== "sent") {
        return res.status(400).json({ error: "Invoice is not in payable status" });
      }

      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ error: "Payment service not configured" });
      }

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(invoice.amountDue) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          memberId: invoice.memberId,
        },
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Stripe Webhook Reconciliation Endpoint  
  app.post("/api/webhooks/stripe", async (req: any, res) => {
    let event: Stripe.Event;

    try {
      // Verify webhook signature for security
      const signature = req.headers['stripe-signature'] as string;
      if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("Missing Stripe webhook signature or secret");
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }

      // Check if Stripe is configured
      if (!stripe) {
        console.error("Stripe webhook received but Stripe not configured");
        return res.status(503).json({ error: "Payment service not configured" });
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error("Webhook signature verification failed:", error.message);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    try {
      // Handle payment_intent.succeeded event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;

        if (!invoiceId) {
          console.error("No invoiceId in payment intent metadata");
          return res.status(400).json({ error: "Invalid payment intent metadata" });
        }

        // Get invoice and verify it exists
        const invoice = await (await getStorage()).getInvoice(invoiceId);
        if (!invoice) {
          console.error(`Invoice not found: ${invoiceId}`);
          return res.status(404).json({ error: "Invoice not found" });
        }

        // Verify payment amount matches invoice amount
        const expectedAmount = Math.round(Number(invoice.amountDue) * 100);
        if (paymentIntent.amount !== expectedAmount) {
          console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${paymentIntent.amount}`);
          return res.status(400).json({ error: "Payment amount mismatch" });
        }

        // Mark invoice as paid (idempotent operation)
        try {
          const paidInvoice = await (await getStorage()).payInvoice(
            invoiceId,
            `Stripe (${paymentIntent.payment_method})`,
            paymentIntent.id
          );

          // Send payment notifications
          const memberProfile = await (await getStorage()).getMemberProfile(invoice.memberId);
          if (memberProfile?.email) {
            await sendPaymentNotificationEmail(
              memberProfile.email,
              paidInvoice,
              {
                paymentMethod: 'Stripe',
                transactionId: paymentIntent.id,
              }
            );
          }

          // If invoice has a contractor, notify them too
          if (invoice.workOrderId) {
            const workOrder = await (await getStorage()).getWorkOrder(invoice.workOrderId);
            if (workOrder?.contractorId) {
              const contractorProfile = await (await getStorage()).getContractorProfile(workOrder.contractorId);
              if (contractorProfile?.email) {
                await sendPaymentNotificationEmail(
                  contractorProfile.email,
                  paidInvoice,
                  {
                    paymentMethod: 'Stripe',
                    transactionId: paymentIntent.id,
                  }
                );
              }
            }
          }

          console.log(`Payment successful: Invoice ${invoice.invoiceNumber} paid via Stripe`);
        } catch (paymentError: any) {
          if (paymentError.code === 'DUPLICATE_OPERATION_ERROR') {
            console.log(`Payment already processed for invoice ${invoiceId}`);
            // This is fine - webhook retry or duplicate payment
          } else {
            console.error("Error processing payment:", paymentError);
            return res.status(500).json({ error: "Failed to process payment" });
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Updated Invoice Payment Endpoint (client-side confirmation only)
  app.post("/api/invoices/:id/pay", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const invoice = await (await getStorage()).getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Only the member being invoiced or admin can pay the invoice
      const memberProfile = await (await getStorage()).getMemberProfile(invoice.memberId);
      
      if (memberProfile?.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Only the invoiced member can pay this invoice" });
      }

      const { paymentMethod, transactionId } = req.body;
      if (!paymentMethod || !transactionId) {
        return res.status(400).json({ error: "paymentMethod and transactionId are required" });
      }
      
      // For new Stripe payments, redirect to payment intent flow
      if (paymentMethod.includes('Stripe') || paymentMethod.includes('Card')) {
        return res.status(400).json({ 
          error: "Please use the new payment intent flow for card payments",
          redirectTo: "/api/payments/intent"
        });
      }

      // Legacy payment processing for non-Stripe payments
      const paidInvoice = await (await getStorage()).payInvoice(req.params.id, paymentMethod, transactionId);
      res.json(paidInvoice);
    } catch (error: any) {
      console.error("Invoice payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Loyalty Points Routes
  app.get("/api/loyalty-points/balance/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user owns this member profile or is admin
      const memberProfile = await (await getStorage()).getMemberProfile(req.params.memberId);
      if (!memberProfile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      
      if (memberProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const balance = await (await getStorage()).getLoyaltyPointBalance(req.params.memberId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/loyalty-points/transactions/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user owns this member profile or is admin
      const memberProfile = await (await getStorage()).getMemberProfile(req.params.memberId);
      if (!memberProfile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      
      if (memberProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const transactions = await (await getStorage()).getLoyaltyPointTransactions(req.params.memberId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/loyalty-points/add", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const { memberId, points, description, referenceId, referenceType } = req.body;
      if (!memberId || !points || !description) {
        return res.status(400).json({ error: "memberId, points, and description are required" });
      }
      const transaction = await (await getStorage()).addLoyaltyPoints(memberId, points, description, referenceId, referenceType);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/loyalty-points/spend", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { memberId, points, description, referenceId, referenceType } = req.body;
      if (!memberId || !points || !description) {
        return res.status(400).json({ error: "memberId, points, and description are required" });
      }

      // Check if user owns this member profile or is admin
      const memberProfile = await (await getStorage()).getMemberProfile(memberId);
      if (!memberProfile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      
      if (memberProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Can only spend your own loyalty points" });
      }

      const transaction = await (await getStorage()).spendLoyaltyPoints(memberId, points, description, referenceId, referenceType);
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
      const deals = await (await getStorage()).getActiveDeals(filters);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await (await getStorage()).getDeal(req.params.id);
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
      const deals = await (await getStorage()).getDealsByMerchant(req.params.merchantId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/deals", isAuthenticated, requireRole(["admin", "merchant"]), async (req: any, res) => {
    try {
      const validatedData = DealCreateSchema.parse(req.body);
      const deal = await (await getStorage()).createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid deal data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/deals/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = DealUpdateSchema.parse(req.body);
      const deal = await (await getStorage()).updateDeal(req.params.id, validatedData);
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

  app.post("/api/deals/:dealId/redeem", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: "memberId is required" });
      }

      // Check if user is redeeming for their own member profile or is admin
      const memberProfile = await (await getStorage()).getMemberProfile(memberId);
      if (!memberProfile) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      
      if (memberProfile.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Can only redeem deals for your own member profile" });
      }

      const redemption = await (await getStorage()).redeemDeal(req.params.dealId, memberId);
      res.status(201).json(redemption);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message Routes
  app.get("/api/messages/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const message = await (await getStorage()).getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user is sender, receiver, or admin
      if (message.senderId !== currentUser.id && message.receiverId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/messages/by-user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own messages or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied - can only view your own messages" });
      }

      const messages = await (await getStorage()).getMessagesByUser(req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/messages/conversation/:senderId/:receiverId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { senderId, receiverId } = req.params;
      
      // Check if user is part of this conversation or admin
      if (currentUser.id !== senderId && currentUser.id !== receiverId && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied - can only view your own conversations" });
      }

      const messages = await (await getStorage()).getConversation(senderId, receiverId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = MessageCreateSchema.parse(req.body);
      
      // Ensure user is sending message from their own account
      const currentUserId = req.user.claims.sub;
      if (validatedData.senderId !== currentUserId) {
        const currentUser = await (await getStorage()).getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only send messages from your own account" });
        }
      }
      
      const message = await (await getStorage()).createMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/messages/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const message = await (await getStorage()).getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Only the receiver or admin can mark message as read
      if (message.receiverId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Can only mark your own received messages as read" });
      }

      const updatedMessage = await (await getStorage()).markMessageAsRead(req.params.id);
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notification Routes
  app.get("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const notification = await (await getStorage()).getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // Check if user owns this notification or is admin
      if (notification.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/notifications/by-user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow access to own notifications or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Access denied - can only view your own notifications" });
      }

      const notifications = await (await getStorage()).getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await (await getStorage()).createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid notification data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const notification = await (await getStorage()).getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // Check if user owns this notification or is admin
      if (notification.userId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Can only mark your own notifications as read" });
      }

      const updatedNotification = await (await getStorage()).markNotificationAsRead(req.params.id);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/read-all/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;
      
      // Only allow marking own notifications or admin access
      if (currentUser?.id !== targetUserId && currentUser?.role !== "admin") {
        return res.status(403).json({ error: "Can only mark your own notifications as read" });
      }

      await (await getStorage()).markAllNotificationsAsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Calendar Event Routes
  app.get("/api/calendar-events/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const event = await (await getStorage()).getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/calendar-events/by-user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      
      // Only allow access to own calendar or admin access
      if (currentUserId !== targetUserId) {
        const currentUser = await (await getStorage()).getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Access denied - can only view your own calendar" });
        }
      }
      
      const events = await (await getStorage()).getCalendarEventsByUser(req.params.userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/calendar-events", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = CalendarEventCreateSchema.parse(req.body);
      
      // Ensure user is creating event for themselves or is admin
      const currentUserId = req.user.claims.sub;
      if (validatedData.userId !== currentUserId) {
        const currentUser = await (await getStorage()).getUser(currentUserId);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ error: "Can only create calendar events for yourself" });
        }
      }
      
      const event = await (await getStorage()).createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid calendar event data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/calendar-events/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const validatedData = CalendarEventUpdateSchema.parse(req.body);
      const event = await (await getStorage()).updateCalendarEvent(req.params.id, validatedData);
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

  app.delete("/api/calendar-events/:id", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteCalendarEvent(req.params.id);
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
      const posts = await (await getStorage()).getCommunityPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/community/posts/:id", async (req, res) => {
    try {
      const post = await (await getStorage()).getCommunityPost(req.params.id);
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
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { authorId, content, images, tags } = req.body;
      if (!authorId || !content) {
        return res.status(400).json({ error: "authorId and content are required" });
      }
      
      // Ensure user is creating post from their own account
      if (authorId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Can only create posts from your own account" });
      }
      
      const post = await (await getStorage()).createCommunityPost(authorId, content, images, tags);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/community/groups", async (req, res) => {
    try {
      const groups = await (await getStorage()).getCommunityGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/community/groups/:id", async (req, res) => {
    try {
      const group = await (await getStorage()).getCommunityGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Community group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/community/groups", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { name, description, category, createdBy } = req.body;
      if (!name || !description || !category || !createdBy) {
        return res.status(400).json({ error: "name, description, category, and createdBy are required" });
      }
      
      // Ensure user is creating group for themselves or is admin
      if (createdBy !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Can only create groups for your own account" });
      }
      
      const group = await (await getStorage()).createCommunityGroup(name, description, category, createdBy);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==========================================
  // ADMIN ROUTES - Comprehensive Data Management
  // ==========================================

  // Admin Counts API
  app.get("/api/admin/counts", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const [
        users, memberProfiles, contractorProfiles, merchantProfiles,
        serviceRequests, workOrders, estimates, invoices, deals, 
        messages, calendarEvents, badges, ranks, achievements, maintenanceItems
      ] = await Promise.all([
        (await getStorage()).getAllUsers(),
        (await getStorage()).getAllMemberProfiles(),
        (await getStorage()).getAllContractorProfiles(),
        (await getStorage()).getAllMerchantProfiles(),
        (await getStorage()).getAllServiceRequests(),
        (await getStorage()).getAllWorkOrders(),
        (await getStorage()).getAllEstimates(),
        (await getStorage()).getAllInvoices(),
        (await getStorage()).getAllDeals(),
        (await getStorage()).getAllMessages(),
        (await getStorage()).getAllCalendarEvents(),
        (await getStorage()).getAllBadges(),
        (await getStorage()).getAllRanks(),
        (await getStorage()).getAllAchievements(),
        (await getStorage()).getAllMaintenanceItems()
      ]);

      const counts = {
        users: users.length,
        memberProfiles: memberProfiles.length,
        contractorProfiles: contractorProfiles.length,
        merchantProfiles: merchantProfiles.length,
        serviceRequests: serviceRequests.length,
        workOrders: workOrders.length,
        estimates: estimates.length,
        invoices: invoices.length,
        deals: deals.length,
        messages: messages.length,
        calendarEvents: calendarEvents.length,
        badges: badges.length,
        ranks: ranks.length,
        achievements: achievements.length,
        maintenanceItems: maintenanceItems.length
      };

      res.json(counts);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const users = await (await getStorage()).getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await (await getStorage()).createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Member Profiles Management
  app.get("/api/admin/memberProfiles", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const profiles = await (await getStorage()).getAllMemberProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/memberProfiles", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertMemberProfileSchema.parse(req.body);
      const profile = await (await getStorage()).createMemberProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid member profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/memberProfiles/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertMemberProfileSchema.partial().parse(req.body);
      const profile = await (await getStorage()).updateMemberProfile(req.params.id, validatedData);
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

  // Admin Contractor Profiles Management
  app.get("/api/admin/contractorProfiles", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const profiles = await (await getStorage()).getAllContractorProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/contractorProfiles", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertContractorProfileSchema.parse(req.body);
      const profile = await (await getStorage()).createContractorProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid contractor profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/contractorProfiles/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertContractorProfileSchema.partial().parse(req.body);
      const profile = await (await getStorage()).updateContractorProfile(req.params.id, validatedData);
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

  // Admin Merchant Profiles Management
  app.get("/api/admin/merchantProfiles", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const profiles = await (await getStorage()).getAllMerchantProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/merchantProfiles", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertMerchantProfileSchema.parse(req.body);
      const profile = await (await getStorage()).createMerchantProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid merchant profile data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/merchantProfiles/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertMerchantProfileSchema.partial().parse(req.body);
      const profile = await (await getStorage()).updateMerchantProfile(req.params.id, validatedData);
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

  // Admin Service Requests Management
  app.get("/api/admin/serviceRequests", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const requests = await (await getStorage()).getAllServiceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/serviceRequests", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertServiceRequestSchema.parse(req.body);
      const request = await (await getStorage()).createServiceRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid service request data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/serviceRequests/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertServiceRequestSchema.partial().parse(req.body);
      const request = await (await getStorage()).updateServiceRequest(req.params.id, validatedData);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json(request);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid service request data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Work Orders Management
  app.get("/api/admin/workOrders", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const orders = await (await getStorage()).getAllWorkOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/workOrders", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await (await getStorage()).createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid work order data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/workOrders/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await (await getStorage()).updateWorkOrder(req.params.id, validatedData);
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

  // Admin Estimates Management
  app.get("/api/admin/estimates", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const estimates = await (await getStorage()).getAllEstimates();
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/estimates", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertEstimateSchema.parse(req.body);
      const estimate = await (await getStorage()).createEstimate(validatedData);
      res.status(201).json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid estimate data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/estimates/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertEstimateSchema.partial().parse(req.body);
      const estimate = await (await getStorage()).updateEstimate(req.params.id, validatedData);
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

  // Admin Invoices Management
  app.get("/api/admin/invoices", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const invoices = await (await getStorage()).getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/invoices", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await (await getStorage()).createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid invoice data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/invoices/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await (await getStorage()).updateInvoice(req.params.id, validatedData);
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

  // Admin Deals Management
  app.get("/api/admin/deals", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deals = await (await getStorage()).getAllDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/deals", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = DealCreateSchema.parse(req.body);
      const deal = await (await getStorage()).createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid deal data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/deals/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = DealUpdateSchema.parse(req.body);
      const deal = await (await getStorage()).updateDeal(req.params.id, validatedData);
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

  // Admin Messages Management
  app.get("/api/admin/messages", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const messages = await (await getStorage()).getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/messages", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = MessageCreateSchema.parse(req.body);
      const message = await (await getStorage()).createMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/messages/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      // Note: Messages don't have a direct update method in storage, only markAsRead
      const { isRead } = req.body;
      if (typeof isRead === 'boolean' && isRead) {
        const message = await (await getStorage()).markMessageAsRead(req.params.id);
        if (!message) {
          return res.status(404).json({ error: "Message not found" });
        }
        res.json(message);
      } else {
        return res.status(400).json({ error: "Only isRead=true updates are supported for messages" });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Calendar Events Management
  app.get("/api/admin/calendarEvents", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const events = await (await getStorage()).getAllCalendarEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/calendarEvents", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = CalendarEventCreateSchema.parse(req.body);
      const event = await (await getStorage()).createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid calendar event data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/calendarEvents/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = CalendarEventUpdateSchema.parse(req.body);
      const event = await (await getStorage()).updateCalendarEvent(req.params.id, validatedData);
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

  app.delete("/api/admin/calendarEvents/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteCalendarEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json({ success: true, message: "Calendar event deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE routes for all admin entities
  app.delete("/api/admin/users/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/memberProfiles/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteMemberProfile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      res.json({ success: true, message: "Member profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/contractorProfiles/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteContractorProfile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contractor profile not found" });
      }
      res.json({ success: true, message: "Contractor profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/merchantProfiles/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteMerchantProfile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Merchant profile not found" });
      }
      res.json({ success: true, message: "Merchant profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/serviceRequests/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteServiceRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json({ success: true, message: "Service request deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/workOrders/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteWorkOrder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json({ success: true, message: "Work order deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/estimates/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteEstimate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      res.json({ success: true, message: "Estimate deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/invoices/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteInvoice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/deals/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteDeal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json({ success: true, message: "Deal deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/messages/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteMessage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Gamification Management

  // Admin Badges Management
  app.get("/api/admin/badges", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const badges = await (await getStorage()).getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/badges", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertBadgeSchema.parse(req.body);
      const badge = await (await getStorage()).createBadge(validatedData);
      res.status(201).json(badge);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid badge data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/badges/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertBadgeSchema.partial().parse(req.body);
      const badge = await (await getStorage()).updateBadge(req.params.id, validatedData);
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }
      res.json(badge);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid badge data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/badges/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteBadge(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Badge not found" });
      }
      res.json({ success: true, message: "Badge deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Ranks Management
  app.get("/api/admin/ranks", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const ranks = await (await getStorage()).getAllRanks();
      res.json(ranks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/ranks", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertRankSchema.parse(req.body);
      const rank = await (await getStorage()).createRank(validatedData);
      res.status(201).json(rank);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid rank data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/ranks/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertRankSchema.partial().parse(req.body);
      const rank = await (await getStorage()).updateRank(req.params.id, validatedData);
      if (!rank) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json(rank);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid rank data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/ranks/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteRank(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Rank not found" });
      }
      res.json({ success: true, message: "Rank deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Achievements Management
  app.get("/api/admin/achievements", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const achievements = await (await getStorage()).getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/achievements", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertAchievementSchema.parse(req.body);
      const achievement = await (await getStorage()).createAchievement(validatedData);
      res.status(201).json(achievement);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid achievement data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/achievements/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertAchievementSchema.partial().parse(req.body);
      const achievement = await (await getStorage()).updateAchievement(req.params.id, validatedData);
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      res.json(achievement);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid achievement data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/achievements/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteAchievement(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      res.json({ success: true, message: "Achievement deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Maintenance Items Management
  app.get("/api/admin/maintenanceItems", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const items = await (await getStorage()).getAllMaintenanceItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/maintenanceItems", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertMaintenanceItemSchema.parse(req.body);
      const item = await (await getStorage()).createMaintenanceItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid maintenance item data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/maintenanceItems/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validatedData = insertMaintenanceItemSchema.partial().parse(req.body);
      const item = await (await getStorage()).updateMaintenanceItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ error: "Maintenance item not found" });
      }
      res.json(item);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid maintenance item data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/maintenanceItems/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const deleted = await (await getStorage()).deleteMaintenanceItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Maintenance item not found" });
      }
      res.json({ success: true, message: "Maintenance item deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // File Upload Routes (PROTECTED)
  const objectStorageService = new ObjectStorageService();

  // Upload files endpoint - supports multiple files
  app.post('/api/uploads', isAuthenticated, uploadMiddleware.array('files', 5), async (req: FileUploadRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const uploadedFiles = await uploadService.uploadFiles(req.files, userId);
      
      res.json({
        message: "Files uploaded successfully",
        files: uploadedFiles
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      
      if (error instanceof UploadError) {
        return res.status(error.statusCode).json({ 
          error: error.message,
          code: error.code 
        });
      }
      
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  // Get upload URL for direct upload
  app.post('/api/uploads/signed-url', isAuthenticated, async (req: any, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Get file metadata endpoint
  app.get('/api/uploads/:key/metadata', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { key } = req.params;

      const metadata = await uploadService.getFileMetadata(key, userId);
      res.json(metadata);
    } catch (error) {
      console.error("Error getting file metadata:", error);
      
      if (error instanceof UploadError) {
        return res.status(error.statusCode).json({ 
          error: error.message,
          code: error.code 
        });
      }
      
      res.status(500).json({ error: "Failed to get file metadata" });
    }
  });

  // Download file endpoint - returns signed URL
  app.get('/api/uploads/:key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { key } = req.params;
      const ttl = parseInt(req.query.ttl as string) || 3600; // Default 1 hour

      const downloadUrl = await uploadService.getDownloadUrl(key, userId, ttl);
      
      res.json({ 
        downloadUrl,
        expiresIn: ttl 
      });
    } catch (error) {
      console.error("Error getting download URL:", error);
      
      if (error instanceof UploadError) {
        return res.status(error.statusCode).json({ 
          error: error.message,
          code: error.code 
        });
      }
      
      res.status(500).json({ error: "Failed to get download URL" });
    }
  });

  // Delete file endpoint
  app.delete('/api/uploads/:key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { key } = req.params;

      const deleted = await uploadService.deleteFile(key, userId);
      
      if (deleted) {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete file" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      
      if (error instanceof UploadError) {
        return res.status(error.statusCode).json({ 
          error: error.message,
          code: error.code 
        });
      }
      
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Serve private objects with ACL checks
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public objects
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===========================
  // SCHEDULING SYSTEM ENDPOINTS
  // ===========================

  // Get contractor availability
  app.get("/api/contractors/:id/availability", isAuthenticated, async (req: any, res) => {
    try {
      const { id: contractorId } = req.params;
      const { startDate, endDate, slotDuration, slotType, timezone } = req.query;

      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      // Check if contractor exists
      const contractor = await (await getStorage()).getContractorProfile(contractorId);
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }

      // Check access permissions
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Allow access if user is the contractor, admin, or member making a booking
      const isContractor = contractor.userId === currentUser.id;
      const isAdmin = currentUser.role === "admin";
      
      if (!isContractor && !isAdmin && currentUser.role !== "homeowner") {
        return res.status(403).json({ error: "Access denied" });
      }

      const availabilityRequest: AvailabilityRequest = {
        contractorId,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        slotDuration: slotDuration as any || '2_hour',
        slotType: slotType as any || 'standard',
        timezone: timezone as string
      };

      const availableSlots = await schedulingService.generateAvailableSlots(availabilityRequest);
      
      res.json({
        contractorId,
        requestedPeriod: {
          startDate: availabilityRequest.startDate,
          endDate: availabilityRequest.endDate
        },
        totalSlots: availableSlots.length,
        availableSlots: availableSlots
      });
    } catch (error: any) {
      console.error("Error getting contractor availability:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  });

  // Check for scheduling conflicts
  app.get("/api/schedules/conflicts", isAuthenticated, async (req: any, res) => {
    try {
      const { contractorId, startTime, endTime } = req.query;

      if (!contractorId || !startTime || !endTime) {
        return res.status(400).json({ 
          error: "contractorId, startTime, and endTime are required" 
        });
      }

      // Check access permissions
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const contractor = await (await getStorage()).getContractorProfile(contractorId as string);
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }

      const isContractor = contractor.userId === currentUser.id;
      const isAdmin = currentUser.role === "admin";
      
      if (!isContractor && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      const bookingRequest: SlotBookingRequest = {
        contractorId: contractorId as string,
        startTime: new Date(startTime as string),
        endTime: new Date(endTime as string),
        slotType: 'standard',
        workOrderId: 'check-only' // For conflict checking only
      };

      const conflicts = await schedulingService.detectConflicts(bookingRequest);
      
      res.json({
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts,
        requestedSlot: {
          contractorId,
          startTime: bookingRequest.startTime,
          endTime: bookingRequest.endTime
        }
      });
    } catch (error: any) {
      console.error("Error checking scheduling conflicts:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  });

  // Enhanced work order creation with scheduling
  app.post("/api/work-orders/scheduled", isAuthenticated, csrfProtection, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const {
        // Standard work order fields
        serviceRequestId,
        contractorId,
        description,
        estimatedDuration,
        actualDuration,
        status,
        completionNotes,
        // Scheduling fields
        scheduledStartDate,
        scheduledEndDate,
        slotType,
        memberPreferredDates,
        adminOverride = false,
        overrideReason
      } = req.body;

      // Validate required fields
      if (!serviceRequestId || !contractorId || !scheduledStartDate || !scheduledEndDate) {
        return res.status(400).json({ 
          error: "serviceRequestId, contractorId, scheduledStartDate, and scheduledEndDate are required" 
        });
      }

      // Check if admin override is being used by non-admin
      if (adminOverride && currentUser.role !== "admin") {
        return res.status(403).json({ 
          error: "Only admins can use scheduling overrides" 
        });
      }

      const bookingRequest: SlotBookingRequest = {
        contractorId,
        startTime: new Date(scheduledStartDate),
        endTime: new Date(scheduledEndDate),
        slotType: slotType || 'standard',
        workOrderId: `temp_${Date.now()}`, // Temporary ID for validation
        memberPreferredDates: memberPreferredDates?.map((date: string) => new Date(date))
      };

      // Check for conflicts unless admin override is specified
      if (!adminOverride) {
        const conflicts = await schedulingService.detectConflicts(bookingRequest);
        if (conflicts.length > 0) {
          return res.status(409).json({
            error: "Scheduling conflict detected",
            conflicts: conflicts,
            message: "The requested time slot conflicts with existing bookings. Use admin override to force booking."
          });
        }
      }

      // Create work order with scheduling information
      const workOrderData = {
        serviceRequestId,
        contractorId,
        description,
        estimatedDuration,
        actualDuration,
        status: status || "created",
        completionNotes,
        scheduledStartDate: new Date(scheduledStartDate),
        scheduledEndDate: new Date(scheduledEndDate),
        slotType: slotType || 'standard',
        memberPreferredDates: memberPreferredDates?.map((date: string) => new Date(date)),
        hasSchedulingConflicts: adminOverride, // Mark if admin override was used
        adminOverride: adminOverride,
        adminOverrideReason: adminOverride ? overrideReason : null,
        adminOverrideBy: adminOverride ? currentUser.id : null
      };

      const workOrder = await (await getStorage()).createWorkOrder(workOrderData);

      // If admin override was used, handle the override process
      if (adminOverride && currentUser.role === "admin") {
        const adminOverrideRequest: AdminSlotOverrideRequest = {
          contractorId,
          startTime: new Date(scheduledStartDate),
          endTime: new Date(scheduledEndDate),
          workOrderId: workOrder.id,
          overrideReason: overrideReason || "Admin scheduling override",
          adminUserId: currentUser.id
        };

        await schedulingService.handleAdminOverride(adminOverrideRequest);
      } else {
        // Book the slot normally
        bookingRequest.workOrderId = workOrder.id;
        await schedulingService.bookSlot(bookingRequest);
      }

      res.status(201).json({
        ...workOrder,
        schedulingInfo: {
          conflictOverride: adminOverride,
          slotBooked: true,
          bookingTimestamp: new Date()
        }
      });
    } catch (error: any) {
      console.error("Error creating scheduled work order:", error);
      if (error.message?.includes("Conflict")) {
        return res.status(409).json({ 
          error: "Scheduling conflict", 
          message: error.message 
        });
      }
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  });

  // Admin schedule override endpoint
  app.post("/api/admin/schedule-override", isAuthenticated, csrfProtection, requireRole(["admin"]), async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const {
        contractorId,
        startTime,
        endTime,
        workOrderId,
        overrideReason
      } = req.body;

      if (!contractorId || !startTime || !endTime || !workOrderId) {
        return res.status(400).json({ 
          error: "contractorId, startTime, endTime, and workOrderId are required" 
        });
      }

      if (!overrideReason || overrideReason.trim().length === 0) {
        return res.status(400).json({ 
          error: "overrideReason is required for admin overrides" 
        });
      }

      // Verify work order exists
      const workOrder = await (await getStorage()).getWorkOrder(workOrderId);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }

      const adminOverrideRequest: AdminSlotOverrideRequest = {
        contractorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        workOrderId,
        overrideReason: overrideReason.trim(),
        adminUserId: currentUser.id
      };

      // Detect conflicts to show what's being overridden
      const conflicts = await schedulingService.detectConflicts({
        contractorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        slotType: 'standard',
        workOrderId
      });

      // Handle the override
      await schedulingService.handleAdminOverride(adminOverrideRequest);

      // Update the work order to reflect the override
      await (await getStorage()).updateWorkOrder(workOrderId, {
        scheduledStartDate: new Date(startTime),
        scheduledEndDate: new Date(endTime),
        hasSchedulingConflicts: true,
        adminOverride: true,
        adminOverrideReason: overrideReason.trim(),
        adminOverrideBy: currentUser.id
      });

      res.json({
        success: true,
        message: "Admin scheduling override applied successfully",
        overrideDetails: {
          workOrderId,
          conflictsOverridden: conflicts.length,
          conflicts: conflicts,
          overrideReason: overrideReason.trim(),
          overriddenBy: currentUser.id,
          overriddenAt: new Date()
        }
      });
    } catch (error: any) {
      console.error("Error applying admin schedule override:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  });

  // Get schedule conflicts for a contractor
  app.get("/api/contractors/:id/conflicts", isAuthenticated, async (req: any, res) => {
    try {
      const { id: contractorId } = req.params;
      const { includeResolved = "false" } = req.query;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const contractor = await (await getStorage()).getContractorProfile(contractorId);
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }

      // Check permissions
      const isContractor = contractor.userId === currentUser.id;
      const isAdmin = currentUser.role === "admin";
      
      if (!isContractor && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      const conflicts = await (await getStorage()).getScheduleConflictsByContractor(
        contractorId, 
        includeResolved === "true"
      );

      res.json({
        contractorId,
        totalConflicts: conflicts.length,
        unresolvedConflicts: conflicts.filter(c => !c.isResolved).length,
        conflicts: conflicts
      });
    } catch (error: any) {
      console.error("Error getting contractor conflicts:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  });

  // Resolve a schedule conflict
  app.patch("/api/conflicts/:id/resolve", isAuthenticated, requireRole(["admin", "contractor"]), async (req: any, res) => {
    try {
      const { id: conflictId } = req.params;
      const { resolutionNotes } = req.body;

      if (!resolutionNotes || resolutionNotes.trim().length === 0) {
        return res.status(400).json({ 
          error: "resolutionNotes are required" 
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const conflict = await (await getStorage()).getScheduleConflict(conflictId);
      if (!conflict) {
        return res.status(404).json({ error: "Conflict not found" });
      }

      // Check permissions - contractor can resolve their own conflicts, admin can resolve any
      if (currentUser.role !== "admin") {
        const contractor = await (await getStorage()).getContractorProfile(conflict.contractorId);
        if (!contractor || contractor.userId !== currentUser.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const resolvedConflict = await (await getStorage()).resolveScheduleConflict(
        conflictId,
        currentUser.id,
        resolutionNotes.trim()
      );

      if (!resolvedConflict) {
        return res.status(404).json({ error: "Conflict not found or already resolved" });
      }

      res.json({
        success: true,
        message: "Conflict resolved successfully",
        conflict: resolvedConflict
      });
    } catch (error: any) {
      console.error("Error resolving schedule conflict:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message 
      });
    }
  });

  // ======================================================================
  // FORUM SYSTEM ENDPOINTS
  // ======================================================================

  // Helper function to check forum access permissions
  async function checkForumAccess(forum: Forum, user: any): Promise<boolean> {
    if (!forum.isPrivate) return true;
    if (user.role === 'admin') return true;
    if (forum.moderatorIds?.includes(user.id)) return true;
    
    // Check membership tier requirements
    if (forum.membershipRequired) {
      const memberProfile = await (await getStorage()).getMemberProfile(user.id);
      if (!memberProfile) return false;
      
      const tierHierarchy = ["HomeHUB", "HomePRO", "HomeHERO", "HomeGURU"];
      const requiredIndex = tierHierarchy.indexOf(forum.membershipRequired);
      const userIndex = tierHierarchy.indexOf(memberProfile.membershipTier);
      if (userIndex < requiredIndex) return false;
    }
    
    // Check required roles
    if (forum.requiredRoles?.length && !forum.requiredRoles.includes(user.role)) {
      return false;
    }
    
    return true;
  }

  // Helper function to check moderation permissions
  function canModeratePost(user: any, forum: Forum, post?: ForumPost): boolean {
    if (user.role === 'admin') return true;
    if (forum.moderatorIds?.includes(user.id)) return true;
    if (post && post.authorId === user.id) return true;
    return false;
  }

  // GET /api/forums - List all accessible forums
  app.get("/api/forums", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const { 
        type, 
        communityGroupId, 
        limit = "20", 
        offset = "0",
        search 
      } = req.query;

      const forums = await (await getStorage()).getForums({
        forumType: type,
        communityGroupId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        searchTerm: search
      });

      // Filter forums based on access permissions
      const accessibleForums = [];
      for (const forum of forums) {
        const hasAccess = await checkForumAccess(forum, currentUser);
        if (hasAccess) {
          accessibleForums.push(forum);
        }
      }

      res.json({
        forums: accessibleForums,
        total: accessibleForums.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error: any) {
      console.error("Error getting forums:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // GET /api/forums/:id - Get forum details
  app.get("/api/forums/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(id);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(forum);
    } catch (error: any) {
      console.error("Error getting forum:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums - Create new forum (admin only)
  app.post("/api/forums", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const validation = ForumCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).createForum({
        ...validation.data,
        createdBy: currentUser.id
      });

      res.status(201).json(forum);
    } catch (error: any) {
      console.error("Error creating forum:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // PUT /api/forums/:id - Update forum (admin only)
  app.put("/api/forums/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const validation = ForumUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const forum = await (await getStorage()).getForum(id);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const updatedForum = await (await getStorage()).updateForum(id, validation.data);
      res.json(updatedForum);
    } catch (error: any) {
      console.error("Error updating forum:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // DELETE /api/forums/:id - Delete forum (admin only)
  app.delete("/api/forums/:id", isAuthenticated, requireRole(["admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const forum = await (await getStorage()).getForum(id);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      await (await getStorage()).deleteForum(id);
      res.json({ message: "Forum deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting forum:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // GET /api/forums/:forumId/topics - List topics in a forum
  app.get("/api/forums/:forumId/topics", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId } = req.params;
      const { 
        limit = "20", 
        offset = "0",
        sort = "lastActivity", // lastActivity, created, title, votes
        status,
        isPinned,
        search
      } = req.query;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const topics = await (await getStorage()).getForumTopics({
        forumId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        sort,
        status,
        isPinned: isPinned === "true" ? true : undefined,
        searchTerm: search
      });

      res.json({
        topics,
        forum: {
          id: forum.id,
          name: forum.name,
          description: forum.description,
          forumType: forum.forumType
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: topics.length
        }
      });
    } catch (error: any) {
      console.error("Error getting forum topics:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // GET /api/forums/:forumId/topics/:topicId - Get topic details with posts
  app.get("/api/forums/:forumId/topics/:topicId", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId } = req.params;
      const { limit = "50", offset = "0", sort = "oldest" } = req.query;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Support slug-based lookup
      const topic = await (await getStorage()).getForumTopic(topicId) || 
                   await (await getStorage()).getForumTopicBySlug(forumId, topicId);
      
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      if (topic.forumId !== forumId) {
        return res.status(400).json({ error: "Topic does not belong to this forum" });
      }

      // Get posts with threading and vote counts
      const posts = await (await getStorage()).getForumPosts({
        topicId: topic.id,
        limit: parseInt(limit),
        offset: parseInt(offset),
        sort,
        includeVotes: true,
        includeAuthor: true
      });

      // Update view count
      await (await getStorage()).updateForumTopic(topic.id, {
        viewCount: topic.viewCount + 1,
        lastActivityAt: new Date()
      });

      res.json({
        topic,
        posts,
        forum: {
          id: forum.id,
          name: forum.name,
          forumType: forum.forumType
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error: any) {
      console.error("Error getting topic details:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums/:forumId/topics - Create new topic
  app.post("/api/forums/:forumId/topics", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId } = req.params;
      const validation = ForumTopicCreateSchema.safeParse({
        ...req.body,
        forumId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if forum is locked
      if (forum.moderation === 'locked' && currentUser.role !== 'admin' && !forum.moderatorIds?.includes(currentUser.id)) {
        return res.status(403).json({ error: "Forum is locked" });
      }

      const { initialPostContent, ...topicData } = validation.data;

      // Create topic and initial post in transaction
      const topic = await (await getStorage()).createForumTopic({
        ...topicData,
        authorId: currentUser.id,
        slug: topicData.slug || topicData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      });

      // Create initial post
      await (await getStorage()).createForumPost({
        topicId: topic.id,
        forumId,
        authorId: currentUser.id,
        content: initialPostContent,
        postType: 'initial'
      });

      // Update forum stats
      await (await getStorage()).updateForum(forumId, {
        topicCount: forum.topicCount + 1,
        postCount: forum.postCount + 1,
        lastActivityAt: new Date(),
        lastTopicId: topic.id
      });

      res.status(201).json(topic);
    } catch (error: any) {
      console.error("Error creating topic:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // PUT /api/forums/:forumId/topics/:topicId - Update topic
  app.put("/api/forums/:forumId/topics/:topicId", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId } = req.params;
      const validation = ForumTopicUpdateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const topic = await (await getStorage()).getForumTopic(topicId);
      if (!topic || topic.forumId !== forumId) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      // Check permissions
      const isAuthor = topic.authorId === currentUser.id;
      const isModerator = canModeratePost(currentUser, forum);
      
      if (!isAuthor && !isModerator) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updatedTopic = await (await getStorage()).updateForumTopic(topicId, validation.data);
      res.json(updatedTopic);
    } catch (error: any) {
      console.error("Error updating topic:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // DELETE /api/forums/:forumId/topics/:topicId - Delete topic
  app.delete("/api/forums/:forumId/topics/:topicId", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId } = req.params;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const topic = await (await getStorage()).getForumTopic(topicId);
      if (!topic || topic.forumId !== forumId) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      // Check permissions
      const isAuthor = topic.authorId === currentUser.id;
      const canDelete = currentUser.role === 'admin' || isAuthor;
      
      if (!canDelete) {
        return res.status(403).json({ error: "Access denied" });
      }

      await (await getStorage()).deleteForumTopic(topicId);
      
      // Update forum stats
      await (await getStorage()).updateForum(forumId, {
        topicCount: Math.max(0, forum.topicCount - 1),
        postCount: Math.max(0, forum.postCount - topic.postCount)
      });

      res.json({ message: "Topic deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting topic:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // GET /api/forums/:forumId/topics/:topicId/posts - Get posts in topic
  app.get("/api/forums/:forumId/topics/:topicId/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId } = req.params;
      const { 
        limit = "50", 
        offset = "0",
        sort = "oldest", // oldest, newest, votes, created
        includeDeleted = "false"
      } = req.query;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const topic = await (await getStorage()).getForumTopic(topicId);
      if (!topic || topic.forumId !== forumId) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const posts = await (await getStorage()).getForumPosts({
        topicId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        sort,
        includeDeleted: includeDeleted === "true" && canModeratePost(currentUser, forum),
        includeVotes: true,
        includeAuthor: true
      });

      res.json({
        posts,
        topic: {
          id: topic.id,
          title: topic.title,
          status: topic.status
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error: any) {
      console.error("Error getting posts:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums/:forumId/topics/:topicId/posts - Create new post/reply
  app.post("/api/forums/:forumId/topics/:topicId/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId } = req.params;
      const validation = ForumPostCreateSchema.safeParse({
        ...req.body,
        forumId,
        topicId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const topic = await (await getStorage()).getForumTopic(topicId);
      if (!topic || topic.forumId !== forumId) {
        return res.status(404).json({ error: "Topic not found" });
      }

      // Check if topic is locked
      if ((topic.status === 'locked' || topic.isLocked) && !canModeratePost(currentUser, forum)) {
        return res.status(403).json({ error: "Topic is locked" });
      }

      const post = await (await getStorage()).createForumPost({
        ...validation.data,
        authorId: currentUser.id
      });

      // Update topic and forum stats
      await (await getStorage()).updateForumTopic(topicId, {
        postCount: topic.postCount + 1,
        lastActivityAt: new Date(),
        lastPostId: post.id
      });

      await (await getStorage()).updateForum(forumId, {
        postCount: forum.postCount + 1,
        lastActivityAt: new Date()
      });

      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // PUT /api/forums/:forumId/topics/:topicId/posts/:postId - Update post
  app.put("/api/forums/:forumId/topics/:topicId/posts/:postId", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId, postId } = req.params;
      const validation = ForumPostUpdateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post || post.topicId !== topicId || post.forumId !== forumId) {
        return res.status(404).json({ error: "Post not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      // Check permissions
      const isAuthor = post.authorId === currentUser.id;
      const isModerator = canModeratePost(currentUser, forum, post);
      
      if (!isAuthor && !isModerator) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updateData = {
        ...validation.data,
        isEdited: true,
        editedAt: new Date()
      };

      const updatedPost = await (await getStorage()).updateForumPost(postId, updateData);
      res.json(updatedPost);
    } catch (error: any) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // DELETE /api/forums/:forumId/topics/:topicId/posts/:postId - Delete post
  app.delete("/api/forums/:forumId/topics/:topicId/posts/:postId", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId, postId } = req.params;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post || post.topicId !== topicId || post.forumId !== forumId) {
        return res.status(404).json({ error: "Post not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      // Check permissions
      const isAuthor = post.authorId === currentUser.id;
      const canDelete = currentUser.role === 'admin' || isAuthor;
      
      if (!canDelete) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Soft delete for initial posts, hard delete for replies
      if (post.postType === 'initial') {
        await (await getStorage()).updateForumPost(postId, { 
          status: 'deleted',
          content: '[Post deleted by author]'
        });
      } else {
        await (await getStorage()).deleteForumPost(postId);
        
        // Update topic stats
        const topic = await (await getStorage()).getForumTopic(topicId);
        if (topic) {
          await (await getStorage()).updateForumTopic(topicId, {
            postCount: Math.max(1, topic.postCount - 1) // Keep at least 1 for initial post
          });
        }
      }

      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums/posts/:postId/vote - Vote on post
  app.post("/api/forums/posts/:postId/vote", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const validation = ForumVoteCreateSchema.safeParse({
        ...req.body,
        postId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if user can vote (can't vote on own posts)
      if (post.authorId === currentUser.id) {
        return res.status(400).json({ error: "Cannot vote on your own post" });
      }

      const forum = await (await getStorage()).getForum(post.forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      const hasAccess = await checkForumAccess(forum, currentUser);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create or update vote
      const existingVote = await (await getStorage()).getPostVote(postId, currentUser.id);
      
      if (existingVote) {
        if (existingVote.voteType === validation.data.voteType) {
          return res.status(400).json({ error: "Already voted with this type" });
        }
        // Update existing vote
        const updatedVote = await (await getStorage()).updatePostVote(existingVote.id, validation.data);
        res.json(updatedVote);
      } else {
        // Create new vote
        const vote = await (await getStorage()).createPostVote({
          ...validation.data,
          userId: currentUser.id
        });
        res.status(201).json(vote);
      }

      // Update post vote counts
      const votes = await (await getStorage()).getPostVotes(postId);
      const upvotes = votes.filter(v => v.voteType === 'up').length;
      const downvotes = votes.filter(v => v.voteType === 'down').length;
      
      await (await getStorage()).updateForumPost(postId, {
        upvotes,
        downvotes,
        score: upvotes - downvotes
      });

    } catch (error: any) {
      console.error("Error voting on post:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // DELETE /api/forums/posts/:postId/vote - Remove vote
  app.delete("/api/forums/posts/:postId/vote", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const existingVote = await (await getStorage()).getPostVote(postId, currentUser.id);
      if (!existingVote) {
        return res.status(404).json({ error: "No vote found" });
      }

      await (await getStorage()).deletePostVote(existingVote.id);

      // Update post vote counts
      const votes = await (await getStorage()).getPostVotes(postId);
      const upvotes = votes.filter(v => v.voteType === 'up').length;
      const downvotes = votes.filter(v => v.voteType === 'down').length;
      
      await (await getStorage()).updateForumPost(postId, {
        upvotes,
        downvotes,
        score: upvotes - downvotes
      });

      res.json({ message: "Vote removed successfully" });
    } catch (error: any) {
      console.error("Error removing vote:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums/:forumId/topics/:topicId/posts/:postId/accept - Accept answer (Q&A forums)
  app.post("/api/forums/:forumId/topics/:topicId/posts/:postId/accept", isAuthenticated, async (req: any, res) => {
    try {
      const { forumId, topicId, postId } = req.params;

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const forum = await (await getStorage()).getForum(forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      if (forum.forumType !== 'qa') {
        return res.status(400).json({ error: "Can only accept answers in Q&A forums" });
      }

      const topic = await (await getStorage()).getForumTopic(topicId);
      if (!topic || topic.forumId !== forumId) {
        return res.status(404).json({ error: "Topic not found" });
      }

      // Only topic author can accept answers
      if (topic.authorId !== currentUser.id) {
        return res.status(403).json({ error: "Only topic author can accept answers" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post || post.topicId !== topicId) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.postType !== 'answer') {
        return res.status(400).json({ error: "Can only accept answer posts" });
      }

      // Remove previous accepted answer
      if (topic.acceptedAnswerId) {
        await (await getStorage()).updateForumPost(topic.acceptedAnswerId, {
          isAcceptedAnswer: false,
          acceptedAt: null,
          acceptedBy: null
        });
      }

      // Accept this answer
      await (await getStorage()).updateForumPost(postId, {
        isAcceptedAnswer: true,
        acceptedAt: new Date(),
        acceptedBy: currentUser.id
      });

      // Mark topic as solved
      await (await getStorage()).updateForumTopic(topicId, {
        status: 'solved',
        isSolved: true,
        acceptedAnswerId: postId
      });

      res.json({ message: "Answer accepted successfully" });
    } catch (error: any) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums/posts/:postId/flag - Flag post for moderation
  app.post("/api/forums/posts/:postId/flag", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const validation = ForumFlagSchema.safeParse({
        ...req.body,
        postId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Create flag/report
      await (await getStorage()).createPostFlag({
        ...validation.data,
        reporterId: currentUser.id
      });

      // Update post status to flagged
      await (await getStorage()).updateForumPost(postId, {
        status: 'flagged'
      });

      res.json({ message: "Post flagged for review" });
    } catch (error: any) {
      console.error("Error flagging post:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // POST /api/forums/posts/:postId/moderate - Moderate post (admin/moderator only)
  app.post("/api/forums/posts/:postId/moderate", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const validation = ForumModerationSchema.safeParse({
        ...req.body,
        postId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const currentUser = await (await getStorage()).getUser(req.user.claims.sub);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const post = await (await getStorage()).getForumPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const forum = await (await getStorage()).getForum(post.forumId);
      if (!forum) {
        return res.status(404).json({ error: "Forum not found" });
      }

      if (!canModeratePost(currentUser, forum, post)) {
        return res.status(403).json({ error: "Access denied" });
      }

      await (await getStorage()).updateForumPost(postId, {
        status: validation.data.status,
        moderatedBy: currentUser.id,
        moderatedAt: new Date(),
        moderatorReason: validation.data.moderatorReason
      });

      res.json({ message: "Post moderated successfully" });
    } catch (error: any) {
      console.error("Error moderating post:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}