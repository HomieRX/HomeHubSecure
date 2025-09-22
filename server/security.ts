import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Request, Response, NextFunction, Express } from 'express';

/**
 * Comprehensive security middleware configuration for HomeHub platform
 */

// Rate limiting configurations
const createRateLimiter = (windowMs: number, max: number, message: string, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { 
      error: 'Too many requests', 
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests,
    handler: (req: Request, res: Response) => {
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    // Skip rate limiting for development if SKIP_RATE_LIMIT is set
    skip: (req: Request) => {
      return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
    }
  });
};

// Define rate limiters for different endpoint types
export const rateLimiters = {
  // Authentication endpoints - strict limits
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests per window
    'Too many authentication attempts. Please try again in 15 minutes.',
    true // Skip successful requests to allow legitimate logins
  ),

  // General API endpoints
  api: createRateLimiter(
    15 * 60 * 1000, // 15 minutes  
    100, // 100 requests per window
    'Too many API requests. Please slow down.'
  ),

  // File upload endpoints - more restrictive
  upload: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 uploads per hour
    'Too many upload attempts. Please try again later.'
  ),

  // Admin endpoints
  admin: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    50, // 50 admin requests per hour
    'Too many admin requests. Please try again later.'
  ),

  // Payment/sensitive endpoints - very strict
  payment: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    3, // 3 payment attempts per window
    'Too many payment attempts. Please try again in 15 minutes.',
    true // Skip successful requests
  ),

  // Public endpoints with higher limits
  public: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    200, // 200 requests per window
    'Too many requests. Please slow down.'
  )
};

/**
 * Configure CORS allowlist based on environment
 */
function getCorsOrigins(): string[] {
  const origins: string[] = [];
  
  // Development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    );
  }
  
  // Production origins from REPLIT_DOMAINS
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    domains.forEach(domain => {
      const cleanDomain = domain.trim();
      origins.push(`https://${cleanDomain}`);
      // Also add without subdomain if it includes one
      if (cleanDomain.includes('.replit.dev')) {
        origins.push(`https://${cleanDomain}`);
      }
    });
  }
  
  // Always allow Replit's OAuth callback
  origins.push('https://replit.com');
  
  return origins;
}

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getCorsOrigins();

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development we expect DEV_ORIGIN exact match
    if (process.env.NODE_ENV === 'development') {
      const devOrigin = process.env.DEV_ORIGIN || 'http://localhost:5173';
      if (origin === devOrigin) return callback(null, true);
      console.warn(`CORS blocked origin (dev strict): ${origin} != ${devOrigin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // Support legacy browsers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining', 
    'RateLimit-Reset'
  ]
};

/**
 * Content Security Policy configuration
 */
function getCSPDirectives() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const directives: any = {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite dev server and React
      ...(isDevelopment ? ["'unsafe-eval'"] : []), // Only allow eval in development
      "https://js.stripe.com",
      "https://checkout.stripe.com"
    ],
    styleSrc: [
      "'self'", 
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      "https://fonts.googleapis.com"
    ],
    imgSrc: [
      "'self'", 
      "data:", 
      "blob:",
      "https:", // Allow images from HTTPS sources
      "*.replit.dev",
      "storage.googleapis.com" // For object storage
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    connectSrc: [
      "'self'",
      ...(isDevelopment ? ["ws:", "wss:"] : []), // WebSocket for Vite HMR
      "https://api.stripe.com",
      "https://checkout.stripe.com",
      "*.replit.dev"
    ],
    frameSrc: [
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com"
    ],
    objectSrc: ["'none'"]
  };

  // Only add upgradeInsecureRequests in production
  if (process.env.NODE_ENV === 'production') {
    directives.upgradeInsecureRequests = [];
  }

  return directives;
}

/**
 * Helmet configuration with comprehensive security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: getCSPDirectives(),
    reportOnly: process.env.NODE_ENV === 'development' // Report-only mode in development
  },
  
  // Cross-origin policies
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // Security headers
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log security-relevant events
  if (req.path.includes('admin') || req.path.includes('auth')) {
    console.log(`Security: ${req.method} ${req.path} from ${req.ip} - User-Agent: ${req.get('User-Agent')?.slice(0, 100)}`);
  }
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // XSS
    /eval\(/i, // Code injection
  ];
  
  const fullUrl = req.originalUrl || req.url;
  const body = JSON.stringify(req.body);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(body)) {
      console.warn(`🚨 SECURITY ALERT: Suspicious request from ${req.ip}:`, {
        method: req.method,
        url: fullUrl,
        userAgent: req.get('User-Agent'),
        body: body.slice(0, 200) // First 200 chars only
      });
      break;
    }
  }
  
  next();
};

/**
 * Apply rate limiting to different route patterns
 */
export function applyRateLimiting(app: Express) {
  // Webhook endpoints - no rate limiting (external services)
  app.use('/api/webhooks', (req, res, next) => {
    // Skip all rate limiting for webhooks
    next();
  });
  
  // Payment endpoints - strictest rate limiting
  app.use('/api/payments', rateLimiters.payment);
  app.use('/api/invoices/*/pay', rateLimiters.payment);
  
  // Authentication endpoints
  app.use('/api/auth', rateLimiters.auth);
  
  // Admin endpoints  
  app.use('/api/admin', rateLimiters.admin);
  
  // Upload endpoints
  app.use('/api/upload', rateLimiters.upload);
  app.use('/api/files', rateLimiters.upload);
  
  // Public endpoints (contractors, merchants directories)
  app.use('/api/contractors', rateLimiters.public);
  app.use('/api/merchants', rateLimiters.public);
  
  // All other API endpoints
  app.use('/api', rateLimiters.api);
  
  console.log('✅ Rate limiting configured for all endpoints');
}

/**
 * Main security middleware setup function
 */
export function setupSecurityMiddleware(app: Express) {
  console.log('🔒 Setting up comprehensive security middleware...');
  
  // 1. Security logging (before other middleware)
  app.use(securityLogger);
  
  // 2. Helmet security headers
  app.use(helmetConfig);
  
  // 3. Rate limiting
  applyRateLimiting(app);
  
  console.log('✅ Security middleware setup complete');
}

/**
 * Error handler for security-related errors
 */
export const securityErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    console.warn(`CORS violation from origin: ${req.get('origin')} to ${req.path}`);
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Your origin is not allowed to access this resource'
    });
  }
  
  // Handle CSP violations
  if (err.message?.includes('Content Security Policy')) {
    console.warn(`CSP violation on ${req.path}:`, err.message);
    return res.status(400).json({
      error: 'Content Security Policy violation',
      message: 'Request blocked by security policy'
    });
  }
  
  next(err);
};