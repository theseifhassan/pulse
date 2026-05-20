import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  ConflictError,
  DatabaseError,
  errorToResponse,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
  ValidationError,
} from "~/server/effect/errors";

describe("AppError tagged classes", () => {
  it("NotFoundError carries resource and optional id", () => {
    const err = new NotFoundError({ resource: "feed_item", id: "abc" });
    expect(err._tag).toBe("NotFoundError");
    expect(err.resource).toBe("feed_item");
    expect(err.id).toBe("abc");
  });

  it("ConflictError carries an existingId", () => {
    const err = new ConflictError({
      resource: "feed_item",
      reason: "source_url already exists",
      existingId: "abc",
    });
    expect(err._tag).toBe("ConflictError");
    expect(err.existingId).toBe("abc");
  });

  it("RateLimitedError carries retryAfterSeconds", () => {
    const err = new RateLimitedError({ retryAfterSeconds: 30 });
    expect(err._tag).toBe("RateLimitedError");
    expect(err.retryAfterSeconds).toBe(30);
  });

  it("ValidationError carries issues", () => {
    const err = new ValidationError({ issues: ["title required"] });
    expect(err._tag).toBe("ValidationError");
    expect(err.issues).toEqual(["title required"]);
  });

  it("errors are yieldable inside Effect.gen", async () => {
    const program = Effect.gen(function* () {
      return yield* Effect.succeed("ok");
    });
    const result = await Effect.runPromise(program);
    expect(result).toBe("ok");

    const failing = Effect.gen(function* () {
      yield* new NotFoundError({ resource: "x" });
      return "unreached";
    });
    const exit = await Effect.runPromiseExit(failing);
    expect(exit._tag).toBe("Failure");
  });
});

describe("errorToResponse", () => {
  it("maps NotFoundError to 404", async () => {
    const res = errorToResponse(
      new NotFoundError({ resource: "feed_item", id: "abc" }),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("NotFound");
    expect(body.resource).toBe("feed_item");
    expect(body.id).toBe("abc");
  });

  it("maps ConflictError to 409 with existing id", async () => {
    const res = errorToResponse(
      new ConflictError({
        resource: "feed_item",
        reason: "duplicate source_url",
        existingId: "abc",
      }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Conflict");
    expect(body.existingId).toBe("abc");
  });

  it("maps UnauthorizedError to 401", async () => {
    const res = errorToResponse(
      new UnauthorizedError({ reason: "missing bearer" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("maps ForbiddenError to 403 (distinct from 401)", async () => {
    const res = errorToResponse(
      new ForbiddenError({ reason: "not the owner" }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("maps RateLimitedError to 429 with Retry-After header", async () => {
    const res = errorToResponse(
      new RateLimitedError({ retryAfterSeconds: 30 }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("maps ValidationError to 400 with issues array", async () => {
    const res = errorToResponse(
      new ValidationError({ issues: ["title required", "body required"] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues).toEqual(["title required", "body required"]);
  });

  it("maps DatabaseError to 500 without leaking cause", async () => {
    const res = errorToResponse(
      new DatabaseError({
        cause: new Error("connection refused: secret-host"),
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("InternalServerError");
    expect(JSON.stringify(body)).not.toContain("secret-host");
  });
});
