import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "~/lib/env";
import * as schema from "~/server/db/schema";

export type Database = PostgresJsDatabase<typeof schema>;

// HMR guard: Next.js dev re-evaluates this module on hot reload. Without a
// process-wide cache, every reload opens a fresh postgres pool and quickly
// exhausts the database's connection limit.
const globalForDb = globalThis as unknown as {
  __pulseConn?: ReturnType<typeof postgres>;
  __pulseDb?: Database;
};

export function getDb(): Database {
  if (globalForDb.__pulseDb) return globalForDb.__pulseDb;
  const env = getServerEnv();
  const conn =
    globalForDb.__pulseConn ?? postgres(env.DATABASE_URL, { prepare: false });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pulseConn = conn;
  }
  const db: Database = drizzle(conn, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pulseDb = db;
  }
  return db;
}

export * from "~/server/db/schema";
