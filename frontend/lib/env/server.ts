import { z } from "zod";
import "dotenv/config";

const PostgreSQLSchema = z.object({
  DATABASE_URL: z.string(),
});

const OAuthSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: z.string(),
});

export const PostgreSQLConfig = PostgreSQLSchema.parse(process.env);
export const OAuthConfig = OAuthSchema.parse(process.env);
