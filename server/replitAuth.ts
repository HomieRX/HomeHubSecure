import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { randomBytes } from "crypto";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { getStorage } from "./storage";
import { getStorageRepositories } from "./storage/repositories";

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
  
  const MemoryStoreFactory = MemoryStore(session);
  let sessionStore: session.Store;
  
  const forceMemoryStore = process.env.USE_MEMORY_SESSION === "1";
  const isProd = process.env.NODE_ENV === 'production';

  if (!forceMemoryStore && process.env.DATABASE_URL && isProd) {
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
      sessionStore = new MemoryStoreFactory({ checkPeriod: sessionTtl });
    }
  } else {
    sessionStore = new MemoryStoreFactory({ checkPeriod: sessionTtl });
    if (forceMemoryStore) {
      console.log("Using in-memory session store (forced by USE_MEMORY_SESSION=1)");
    } else {
      console.log("Using in-memory session store for development");
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    name: process.env.SESSION_COOKIE_NAME || 'hh.sid',
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // secure cookies in production (HTTPS)
      sameSite: isProduction ? 'lax' : 'none', // none for cross-site dev, lax in prod
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

export async function upsertUser(

  claims: any,

) {

  try {

    const firstUser = await checkAndSetFirstUserAsAdmin(claims["sub"]);



    const userData = {

      id: claims["sub"],

      email: claims["email"],

      firstName: claims["first_name"],

      lastName: claims["last_name"],

      profileImageUrl: claims["profile_image_url"],

      ...(firstUser && { role: "admin" as any })

    };



    const { users } = await getStorageRepositories();

    await users.upsertUser(userData);

  } catch (error) {

    console.error("Error upserting user:", error);

    throw new Error("Failed to create or update user");

  }

}



async function checkAndSetFirstUserAsAdmin(userId: string): Promise<boolean> {

  if (process.env.ADMIN_USER_ID && process.env.ADMIN_USER_ID === userId) {

    return true;

  }



  const adminBootstrapEnabled = process.env.ADMIN_BOOTSTRAP === "1" || process.env.NODE_ENV === "development";

  if (!adminBootstrapEnabled) {

    return false;

  }



  try {

    const { users } = await getStorageRepositories();

    const existingUser = await users.getUser(userId);

    if (existingUser?.role === "admin") {

      return true;

    }



    const allUsers = await users.getAllUsers();

    if (!allUsers || allUsers.length === 0) {

      console.log(`Setting first user ${userId} as admin (development mode)`);

      return true;

    }



    const hasAdmin = allUsers.some(user => user.role === "admin");

    if (!hasAdmin) {

      console.log(`No admin found, setting user ${userId} as admin (development mode)`);

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

  // Store the entire minimal user object in session to avoid DB hits on every request
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Skip Replit Auth setup in development if REPLIT_DOMAINS is not set
  if (!process.env.REPLIT_DOMAINS) {
    console.log("REPLIT_DOMAINS not set, setting up development auth (development mode)");
    
    // Development authentication routes
    app.get("/api/login", (req, res) => {
      // Create a mock development user session
      const mockUserClaims = {
        sub: "dev-user-123",
        email: "dev@homehub.com",
        first_name: "Dev",
        last_name: "User"
      };

      const mockUser = {
        claims: mockUserClaims,
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
        
        // Ensure development user exists in database and attach DB role to session user
        try {
          await upsertUser(mockUserClaims);
          const storage = await getStorage();
          const dbUser = await storage.getUser(mockUserClaims.sub);
          if (dbUser) {
            // merge role into session user so middlewares can use it without DB
            (req.user as any).role = dbUser.role;
          }

          if (process.env.NODE_ENV === "development") {
            try {
              await storage.updateUser(mockUserClaims.sub, { role: "admin" as any });
              (req.user as any).role = 'admin';
            } catch (promoteError) {
              console.warn("Failed to promote development user to admin:", promoteError);
            }
          }
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
    try {
      // Persist claims to DB (upsert) and retrieve DB role
      await upsertUser(tokens.claims());
      const storage = await getStorage();
      const userFromDb = await storage.getUser(String(tokens.claims().sub));

      // Build session user object including tokens and db role
      const sessionUser: any = {
        id: userFromDb?.id ?? String(tokens.claims().sub),
        role: userFromDb?.role ?? 'homeowner',
      };
      updateUserSession(sessionUser, tokens);

      verified(null, sessionUser);
    } catch (err) {
      verified(err as Error);
    }
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

  if (req.isAuthenticated?.() && user) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const sessionUser = req.user as any;

      // Prefer role stored in session to avoid DB hit
      const role = sessionUser?.role || sessionUser?.claims?.role;
      if (role && allowedRoles.includes(role)) {
        req.currentUser = sessionUser;
        return next();
      }

      // Fallback: fetch from DB if not present on session
      const userId = sessionUser?.id || sessionUser?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { users } = await getStorageRepositories();
      const user = await users.getUser(String(userId));
      if (!user) return res.status(401).json({ error: "User not found" });

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
      }

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
      const sessionUser = req.user as any;
      const currentUserId = sessionUser?.id || sessionUser?.claims?.sub;
      if (!currentUserId) return res.status(401).json({ error: "Authentication required" });

      const targetUserId = req.params.id || req.body[resourceUserIdField];

      // If role present in session, use it
      const role = sessionUser?.role || sessionUser?.claims?.role;
      if (role === 'admin') {
        req.currentUser = sessionUser;
        return next();
      }

      if (String(currentUserId) === String(targetUserId)) {
        req.currentUser = sessionUser;
        return next();
      }

      // Fallback: do DB lookup to verify
      const { users } = await getStorageRepositories();
      const currentUser = await users.getUser(String(currentUserId));
      if (!currentUser) return res.status(401).json({ error: "User not found" });

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

  // Skip CSRF for known webhook endpoints and the csrf bootstrap endpoint
  if (req.path.startsWith('/api/webhooks') || req.path === '/api/csrf-token') {
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
