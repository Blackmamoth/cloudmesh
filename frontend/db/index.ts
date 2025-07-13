import { PostgreSQLConfig } from "@/lib/env/server";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(PostgreSQLConfig.DATABASE_URL);
