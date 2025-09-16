import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { randomBytes } from "crypto";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";

// Only require REPLIT_DOMAINS in production
if (process.env.NODE_ENV === "production" && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  
  // Use PostgreSQL store in production or when DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
      });
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.warn("Failed to initialize PostgreSQL session store, falling back to memory:", error);
      sessionStore = new MemoryStore(sessionTtl);
    }
  } else {
    // Use memory store for development when no DATABASE_URL
    sessionStore = new MemoryStore(sessionTtl);
    console.log("Using in-memory session store for development");
  }

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Fix dev sessions
      sameSite: "lax", // CSRF protection
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  try {
    // Check if this is the first user and needs admin role
    const firstUser = await checkAndSetFirstUserAsAdmin(claims["sub"]);
    
    const userData = {
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      // Set role based on admin bootstrap logic
      ...(firstUser && { role: "admin" as any })
    };
    
    await storage.upsertUser(userData);
  } catch (error) {
    console.error("Error upserting user:", error);
    throw new Error("Failed to create or update user");
  }
}

async function checkAndSetFirstUserAsAdmin(userId: string): Promise<boolean> {
  // Check if admin is already set via environment variable
  if (process.env.ADMIN_USER_ID && process.env.ADMIN_USER_ID === userId) {
    return true;
  }
  
  // Check if any admin users exist
  try {
    const existingUser = await storage.getUser(userId);
    if (existingUser?.role === "admin") {
      return true; // User is already admin
    }
    
    // Simple check: if this is the only user in the system, make them admin
    // Note: This is a basic implementation - in production you'd want more sophisticated logic
    const allUsers = await storage.getAllUsers?.();
    if (!allUsers || allUsers.length === 0) {
      console.log(`Setting first user ${userId} as admin`);
      return true;
    }
    
    // Check if no admin exists yet
    const hasAdmin = allUsers.some(user => user.role === "admin");
    if (!hasAdmin) {
      console.log(`No admin found, setting user ${userId} as admin`);
      return true;
    }
  } catch (error) {
    console.warn("Error checking admin status, defaulting to non-admin:", error);
  }
  
  return false;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip Replit Auth setup in development if REPLIT_DOMAINS is not set
  if (!process.env.REPLIT_DOMAINS) {
    console.log("REPLIT_DOMAINS not set, setting up development auth (development mode)");
    
    // Development authentication routes
    app.get("/api/login", (req, res) => {
      // Create a mock development user session
      const mockUser = {
        claims: () => ({
          sub: "dev-user-123",
          email: "dev@homehub.com",
          first_name: "Dev",
          last_name: "User"
        }),
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        access_token: "dev-token",
        refresh_token: "dev-refresh-token"
      };
      
      // Set the user in session and create user in database
      req.login(mockUser, async (err) => {
        if (err) {
          console.error("Development login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        
        // Ensure development user exists in database
        try {
          await upsertUser(mockUser.claims());
        } catch (error) {
          console.error("Error creating development user:", error);
        }
        
        res.redirect("/");
      });
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at || !user?.claims) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Token expired" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: `Access denied. Required roles: ${allowedRoles.join(", ")}` 
        });
      }

      // Attach user info to request for downstream use
      req.currentUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

// Check if user can access their own resource or if they're admin
export const requireOwnershipOrAdmin = (resourceUserIdField = 'userId'): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      const targetUserId = req.params.id || req.body[resourceUserIdField];
      
      // Allow access if user owns the resource or is admin
      if (currentUser.id !== targetUserId && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      req.currentUser = currentUser;
      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const csrfProtection: RequestHandler = (req: any, res, next) => {
  // Skip CSRF for API authentication endpoints
  if (req.path.startsWith('/api/login') || req.path.startsWith('/api/callback') || req.path.startsWith('/api/logout')) {
    return next();
  }

  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
};

// Generate and set CSRF token in session
export const setCSRFToken: RequestHandler = (req: any, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  next();
};