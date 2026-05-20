import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { type Effect, Layer, ManagedRuntime } from "effect";
import type { NextResponse } from "next/server";
import * as schema from "~/server/db/schema";
import { Database, type DrizzleDb } from "~/server/effect/database";
import type { AppError } from "~/server/effect/errors";
import { runHandlerWith } from "~/server/effect/runtime";

export interface TestRuntime {
  readonly pg: PGlite;
  readonly db: DrizzleDb;
  readonly runtime: ManagedRuntime.ManagedRuntime<Database, never>;
  readonly run: (
    effect: Effect.Effect<NextResponse, AppError, Database>,
  ) => Promise<NextResponse>;
  readonly reset: () => Promise<void>;
  readonly close: () => Promise<void>;
}

export async function makeTestRuntime(): Promise<TestRuntime> {
  const pg = new PGlite();
  // pglite's drizzle adapter returns its own DB type, but the v1 schema
  // is dialect-compatible with postgres-js so we coerce for the Effect
  // service layer.
  const db = drizzle(pg, { schema }) as unknown as DrizzleDb;
  await migrate(db as never, { migrationsFolder: "./drizzle" });
  const layer = Layer.succeed(Database)(db);
  const runtime = ManagedRuntime.make(layer);
  const run = runHandlerWith(runtime);
  return {
    pg,
    db,
    runtime,
    run,
    reset: async () => {
      await db.execute(
        sql`TRUNCATE TABLE feedback, feed_items RESTART IDENTITY`,
      );
    },
    close: async () => {
      await runtime.dispose();
      await pg.close();
    },
  };
}
