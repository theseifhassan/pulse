import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context, Effect, Layer } from "effect";
import postgres from "postgres";
import { getServerEnv } from "~/lib/env";
import * as schema from "~/server/db/schema";

export type DrizzleDb = PostgresJsDatabase<typeof schema>;

export class Database extends Context.Service<Database, DrizzleDb>()(
  "pulse/Database",
) {}

export const DatabaseLive = Layer.effect(Database)(
  Effect.sync(() => {
    const env = getServerEnv();
    const client = postgres(env.DATABASE_URL, { prepare: false });
    return drizzle(client, { schema });
  }),
);
