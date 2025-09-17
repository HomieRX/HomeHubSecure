import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurityMiddleware, corsConfig, securityErrorHandler } from "./security";

// Environment validation schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  STORAGE_BACKEND: z.enum(["memory", "database"]).default("memory"),
  
  // Server Configuration  
  PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(65535)).default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Authentication & Security
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters for security"),
  ISSUER_URL: z.string().url().default("https://replit.com/oidc"),
  REPL_ID: z.string().min(1, "REPL_ID is required for authentication"),
  
  // Production requires REPLIT_DOMAINS
  REPLIT_DOMAINS: z.string().optional(),
  
  // Admin Configuration (Optional)
  ADMIN_USER_ID: z.string().optional(),
  ADMIN_BOOTSTRAP: z.enum(["0", "1"]).default("0"),
  
  // External Integrations (Optional)
  TESTING_STRIPE_SECRET_KEY: z.string().optional(),
  TESTING_VITE_STRIPE_PUBLIC_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  
  // Development Tools (Optional)
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info")
});

/**
 * Validates environment variables against schema and fails fast if any required vars are missing
 * @throws {Error} If validation fails with detailed error messages
 */
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional validation for production requirements
    if (env.NODE_ENV === "production") {
      if (!env.REPLIT_DOMAINS) {
        throw new Error("REPLIT_DOMAINS is required in production environment");
      }
      if (env.STORAGE_BACKEND !== "database") {
        throw new Error("STORAGE_BACKEND must be 'database' in production environment");
      }
    }
    
    // Validate session secret strength
    if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters for security");
    }
    
    console.log(`✅ Environment validation passed (${env.NODE_ENV} mode)`);
    return env;
  } catch (error: unknown) {
    console.error("❌ Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(`  - ${error instanceof Error ? error.message : String(error)}`);
    }
    console.error("\n💡 Check your .env file against .env.example");
    process.exit(1);
  }
}

// Validate environment before starting server
validateEnv();

const app = express();

// 1. Apply security middleware first (helmet, rate limiting, security logging)
setupSecurityMiddleware(app);

// 2. CORS configuration (after security headers)
app.use(cors(corsConfig));

// 3. Body parsing middleware (after CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use(securityErrorHandler);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
