import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import errorHandler from "./middleware/error.middleware.js";

import notificationRoutes from "./routes/notification.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import usersRoutes from "./routes/users.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import blogsRoutes from "./routes/blogs.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import forumsRoutes from "./routes/forums.routes.js";
import groupsRoutes from "./routes/groups.routes.js";
import mentorsRoutes from "./routes/mentors.routes.js";
import resourceRoutes from "./routes/resources.routes.js";
import toolRoutes from "./routes/tool.routes.js";
import SeminarRoutes from "./routes/seminar.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import userSettingsRoutes from "./routes/userSettings.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://localhost:3000",
      "http:localhost:3001",
      "https://kea-user.vercel.app",
      "https://kea-admin.vercel.app",
      "https://admin.kea.nexcorealliance.com",
      "https://user.kea.nexcorealliance.com",
    ],
    credentials: true,
  })
);

// =====================
// BASIC MIDDLEWARE
// =====================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =====================
// CUSTOM SECURITY MIDDLEWARE
// =====================

// Custom NoSQL Injection Protection
const sanitizeNoSQL = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (key.includes("$") || key.includes(".")) {
          console.warn(`⚠️  Blocked NoSQL injection: ${key}`);
          delete obj[key];
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitize(obj[key]);
        }
      });
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// Custom XSS Protection
const sanitizeXSS = (req, res, next) => {
  const clean = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "string") {
          // Remove script tags and event handlers
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
            .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/<iframe/gi, "");
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          clean(obj[key]);
        }
      });
    }
  };

  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);

  next();
};

// =====================
// SECURITY HEADERS
// =====================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// =====================
// CORS CONFIGURATION
// =====================

// =====================
// APPLY SECURITY MIDDLEWARE
// =====================

app.use(sanitizeNoSQL);
app.use(sanitizeXSS);

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "category",
      "search",
      "page",
      "limit",
      "sort",
      "status",
      "eventType",
      "year",
      "month",
    ],
  })
);

// Compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// =====================
// RATE LIMITING
// =====================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
  message:
    "Too many authentication attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const userActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests, please slow down",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);

// =====================
// DATABASE & STATIC FILES
// =====================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB(process.env.MONGO_URI);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")
  )
);

// =====================
// API ROUTES
// =====================

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/jobs", userActionLimiter, jobsRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/forums", userActionLimiter, forumsRoutes);
app.use("/api/groups", userActionLimiter, groupsRoutes);
app.use("/api/mentors", mentorsRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/gallery", userActionLimiter, galleryRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/seminars", SeminarRoutes);
app.use("/api/settings/user", userActionLimiter, userSettingsRoutes);
app.use("/api/feedback", userActionLimiter, feedbackRoutes);

// =====================
// HEALTH CHECK
// =====================

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// =====================
// 404 HANDLER
// =====================

app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// =====================
// ERROR HANDLER
// =====================

app.use(errorHandler);

// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 KEA Backend Server Running       ║
║   Port: ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || "development"}         ║
║   Security: ✅ Custom Middleware      ║
║   Rate Limiting: ✅ Active            ║
║   NoSQL Protection: ✅ Enabled        ║
║   XSS Protection: ✅ Enabled          ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});

export default app;
