import { Redis } from "ioredis";
import { env } from "@/lib/env";

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASS,
  db: env.REDIS_DB,
});
