import { Redis } from "ioredis";
import { RedisConfig } from "./env/server";

export const redisClient = new Redis({
  host: RedisConfig.REDIS_HOST,
  port: RedisConfig.REDIS_PORT,
  password: RedisConfig.REDIS_PASS,
  db: RedisConfig.REDIS_DB,
});
