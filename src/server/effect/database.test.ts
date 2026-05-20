import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { Database, type DrizzleDb } from "~/server/effect/database";

describe("Database service", () => {
  it("can be provided via a Layer.succeed and yielded from an Effect", async () => {
    const fakeDb = { tag: "fake-db" } as unknown as DrizzleDb;
    const testLayer = Layer.succeed(Database)(fakeDb);
    const program = Effect.gen(function* () {
      const db = yield* Database;
      return db;
    });
    const result = await Effect.runPromise(Effect.provide(program, testLayer));
    expect(result).toBe(fakeDb);
  });

  it("Database key has a stable tag identifier", () => {
    expect(Database.key).toContain("Database");
  });
});
