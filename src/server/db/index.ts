import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "~/lib/env";
import * as schema from "~/server/db/schema";

let cached: ReturnType<typeof drizzle> | undefined;
let cachedClient: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (cached) return cached;
  const env = getServerEnv();
  cachedClient = postgres(env.DATABASE_URL, { prepare: false });
  cached = drizzle(cachedClient, { schema });
  return cached;
}

export type Database = ReturnType<typeof getDb>;
export * from "~/server/db/schema";
