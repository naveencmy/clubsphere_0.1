import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { observabilityMiddleware } from "./middleware/observability.js";
import { NotFoundError } from "./utils/errors.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import experimentRoutes from "./routes/experimentRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import merchandiseRoutes from "./routes/merchandiseRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import { query } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "../public");

export const app = express();

// Global observability and request tracing
app.use(observabilityMiddleware);

// Security and utility middleware (CSP disabled to allow Razorpay checkout frame and CDN)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);
// Better Auth must read the request stream before Express body parsers.
// A separate base path preserves the existing /api/auth/login and /register contracts.
app.all("/api/auth/session{/*splat}", toNodeHandler(auth));
app.get("/api/auth/workspace", async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session)
      return res.status(401).json({ message: "Sign in to continue." });
    const profile = await query(
      "SELECT student_id_number, academic_major, graduation_year, emergency_contact_name, emergency_contact_phone FROM user_profiles WHERE user_id = $1",
      [session.user.id],
    );
    const memberships = await query(
      `SELECT m.id, m.role, m.tier, m.status, 
              COALESCE(m.valid_from, NOW() - INTERVAL '30 days') AS valid_from, 
              COALESCE(m.valid_until, NOW() + INTERVAL '1 year') AS valid_until, 
              COALESCE(m.qr_secret_token, 'PASS-' || m.id) AS pass_code,
              m.dues_paid_cents, 
              c.slug AS club_slug 
       FROM club_memberships m 
       JOIN clubs c ON c.id = m.club_id 
       WHERE m.user_id = $1 AND c.is_active = TRUE`,
      [session.user.id],
    );
    return res.json({
      userId: session.user.id,
      profile: profile.rows[0] || null,
      memberships: memberships.rows,
    });
  } catch (error) {
    next(error);
  }
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));

if (config.NODE_ENV !== "test") {
  app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
}

// Health check probes
app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
    service: "ClubSphere API Gateway",
    version: "1.0.0",
  });
});

app.get(["/health/ready", "/api/health/ready"], async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbHealth.connected ? "READY" : "DEGRADED",
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
});

// Direct interactive checkout page
app.get(["/", "/checkout"], (req, res, next) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) next();
  });
});

// Mount core business modules
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/experiments", experimentRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/store", merchandiseRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/ledger", ledgerRoutes);

// Mount payment modules (supports /api/create-order and /api/payment/create-order)
app.use("/api/payment", paymentRoutes);
app.use("/api", paymentRoutes);

// Catch 404 routes
app.use((req, res, next) => {
  next(
    new NotFoundError(
      `Route ${req.method} ${req.originalUrl} not found on this server.`,
    ),
  );
});

// Centralized error handling middleware
app.use(errorHandler);
