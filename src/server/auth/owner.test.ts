import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { requireOwner } from "~/server/auth/owner";

const owner = "user_owner_xyz";

describe("requireOwner", () => {
  it("succeeds when the authenticated user id matches the configured owner", async () => {
    const result = await Effect.runPromise(
      requireOwner({ userId: owner, ownerUserId: owner }),
    );
    expect(result).toBe(owner);
  });

  it("fails with UnauthorizedError when userId is null", async () => {
    const exit = await Effect.runPromiseExit(
      requireOwner({ userId: null, ownerUserId: owner }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const err = exit.cause;
      expect(JSON.stringify(err)).toMatch(/not authenticated/);
    }
  });

  it("fails with UnauthorizedError when userId is undefined", async () => {
    const exit = await Effect.runPromiseExit(
      requireOwner({ userId: undefined, ownerUserId: owner }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("fails with UnauthorizedError when authenticated user is not the owner", async () => {
    const exit = await Effect.runPromiseExit(
      requireOwner({ userId: "user_someone_else", ownerUserId: owner }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(JSON.stringify(exit.cause)).toMatch(/not the owner/);
    }
  });

  it("does not leak the user id in the error reason for non-owner case", async () => {
    const exit = await Effect.runPromiseExit(
      requireOwner({
        userId: "user_someone_with_secret",
        ownerUserId: owner,
      }),
    );
    expect(JSON.stringify(exit)).not.toContain("user_someone_with_secret");
  });
});
