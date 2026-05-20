import { Effect, Layer, ManagedRuntime } from "effect";
import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { Database, type DrizzleDb } from "~/server/effect/database";
import { NotFoundError, ValidationError } from "~/server/effect/errors";
import { runHandlerWith } from "~/server/effect/runtime";

function makeTestRuntime() {
  const fakeDb = { tag: "fake-db" } as unknown as DrizzleDb;
  const layer = Layer.succeed(Database)(fakeDb);
  return ManagedRuntime.make(layer);
}

describe("runHandlerWith", () => {
  it("returns the NextResponse from a successful Effect", async () => {
    const runtime = makeTestRuntime();
    const run = runHandlerWith(runtime);
    const result = await run(
      Effect.succeed(NextResponse.json({ ok: true }, { status: 200 })),
    );
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body.ok).toBe(true);
  });

  it("maps a NotFoundError to a 404 response", async () => {
    const runtime = makeTestRuntime();
    const run = runHandlerWith(runtime);
    const result = await run(
      Effect.fail(new NotFoundError({ resource: "feed_item", id: "x" })),
    );
    expect(result.status).toBe(404);
  });

  it("maps a ValidationError to a 400 response with issues", async () => {
    const runtime = makeTestRuntime();
    const run = runHandlerWith(runtime);
    const result = await run(
      Effect.fail(new ValidationError({ issues: ["title required"] })),
    );
    expect(result.status).toBe(400);
    const body = await result.json();
    expect(body.issues).toEqual(["title required"]);
  });

  it("provides Database to handlers that yield it", async () => {
    const runtime = makeTestRuntime();
    const run = runHandlerWith(runtime);
    const program = Effect.gen(function* () {
      const db = yield* Database;
      return NextResponse.json({ db: (db as unknown as { tag: string }).tag });
    });
    const result = await run(program);
    const body = await result.json();
    expect(body.db).toBe("fake-db");
  });
});
