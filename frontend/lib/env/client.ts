import { z } from "zod";
import "dotenv/config";

const APISchema = z.object({
  API_URL: z.string(),
});

export const APIConfig = APISchema.parse({
  API_URL: process.env.NEXT_PUBLIC_API_URL,
});
