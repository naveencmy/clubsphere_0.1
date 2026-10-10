import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/clubsphere'),
  JWT_SECRET: z.string().default('clubsphere_jwt_super_secret_production_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  QR_SIGNING_SECRET: z.string().default('clubsphere_qr_hmac_secret_key_rotation_token'),
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder_for_mock_and_dev'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;
