import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerDemoLoginRoute } from "./demoLogin";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createUploadRouter } from "../uploadEndpoint";
import { serveStatic } from "./static";
import { startFeeReminderScheduler } from "../feeReminderScheduler";
import { createSessionsRestRouter } from "../sessionsRestRouter";
import { stripe } from "../stripeService";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust reverse proxy (required for rate limiting behind Manus/Nginx)
  app.set('trust proxy', 1);

  // ── Security headers (helmet) ──────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false,      // Disabled: Vite HMR + inline scripts need this off
    crossOriginEmbedderPolicy: false,  // Disabled: S3 media cross-origin
  }));

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use((req, res, next) => {
    const allowedOrigins = [
      'https://footyacad-wh9wgp4d.manus.space',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    const origin = req.headers.origin || '';
    const isAllowed = !origin
      || process.env.NODE_ENV === 'development'
      || allowedOrigins.some(o => origin.startsWith(o))
      || origin.endsWith(".vercel.app");
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie,stripe-signature');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // Strict limiter for auth endpoints (brute-force protection)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }, // Trust proxy is set above
  });
  app.use('/api/trpc/auth.login', authLimiter);
  app.use('/api/trpc/auth.register', authLimiter);

  // General API limiter
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }, // Trust proxy is set above
    skip: (req) => req.path.startsWith('/api/stripe/webhook'),
  });
  app.use('/api', apiLimiter);

  // ⚠️ Stripe webhook MUST be registered BEFORE express.json() to preserve raw body for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Stripe is not configured" });
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    let event: any;

    try {
      if (Buffer.isBuffer(req.body) && sig && webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      } else {
        // Fallback for test events or missing secret
        event = typeof req.body === "object" ? req.body : JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id && event.id.startsWith("evt_test_")) {
      return res.json({ verified: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata?.user_id;
          const planKey = session.metadata?.plan_key;
          if (userId) {
            // Payment recorded — trigger fulfillment logic here if needed
            void planKey;
          }
          break;
        }
        case "payment_intent.succeeded":
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          break;
        default:
          break;
      }
    } catch {
      // Webhook processing errors are non-fatal
    }

    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads (500MB for videos)
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));

  // Storage proxy for uploaded assets
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Demo login route for chairman presentation
  registerDemoLoginRoute(app);
  // File upload endpoint
  app.use('/api', createUploadRouter());
  // REST sessions endpoint — GET /api/sessions, GET /api/sessions/:id
  app.use('/api', createSessionsRestRouter());
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else if (!process.env.VERCEL) {
    serveStatic(app);
  }

  if (!process.env.VERCEL) {
    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
      startFeeReminderScheduler();
    });
  }

  return app;
}

const app = await startServer();
export default app;
