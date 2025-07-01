import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { OAuthConfig } from "./env";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  socialProviders: {
    google: {
      clientId: OAuthConfig.GOOGLE_CLIENT_ID,
      clientSecret: OAuthConfig.GOOGLE_CLIENT_SECRET,
      redirectURI: OAuthConfig.GOOGLE_CALLBACK_URL,
    },
    github: {
      clientId: OAuthConfig.GITHUB_CLIENT_ID,
      clientSecret: OAuthConfig.GITHUB_CLIENT_SECRET,
      redirectURI: OAuthConfig.GOOGLE_CALLBACK_URL,
    },
  },
  plugins: [jwt()],
});
