import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { pool } from "./db.js";
import { config } from "./env.js";

const developmentSecret = randomBytes(32).toString("hex");

export function createAuthentication(overrides = {}) {
  const secret =
    process.env.BETTER_AUTH_SECRET ||
    (config.NODE_ENV !== "production" ? developmentSecret : null);
  if (!secret && !overrides.secret)
    throw new Error(
      "Set BETTER_AUTH_SECRET before starting production authentication.",
    );
  return betterAuth({
    appName: "ClubSphere",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
    basePath: "/api/auth/session",
    secret,
    database: pool,
    trustedOrigins: [
      config.CORS_ORIGIN,
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:4173",
    ],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 72,
      password: {
        hash: (password) => bcrypt.hash(password, 12),
        verify: ({ password, hash }) => bcrypt.compare(password, hash),
      },
    },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              prompt: "select_account",
            },
          }
        : {},
    user: {
      modelName: "users",
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      additionalFields: {
        systemRole: {
          type: "string",
          fieldName: "system_role",
          defaultValue: "STUDENT_USER",
          input: false,
        },
      },
    },
    session: {
      modelName: "sessions",
      fields: {
        userId: "user_id",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      cookieCache: { enabled: false },
    },
    account: {
      modelName: "accounts",
      fields: {
        userId: "user_id",
        accountId: "account_id",
        providerId: "provider_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "verifications",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    advanced: { database: { generateId: () => randomUUID() } },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: { "/sign-in/email": { window: 60, max: 10 } },
    },
    ...overrides,
  });
}

export const auth = createAuthentication();
