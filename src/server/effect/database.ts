import "server-only";

import { Context, Effect, Layer } from "effect";
import { type Database as DrizzleDb, getDb } from "~/server/db";

export type { DrizzleDb };

export class Database extends Context.Service<Database, DrizzleDb>()(
  "pulse/Database",
) {}

// The HMR-safe Drizzle singleton lives in src/server/db/index.ts. The Effect
// layer is a thin wrapper that hands it to the service container, so tests
// can swap it via Layer.succeed(Database)(fakeDb) without touching env.
export const DatabaseLive = Layer.effect(Database)(Effect.sync(() => getDb()));
