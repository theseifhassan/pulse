import { Effect } from "effect";
import { UnauthorizedError } from "~/server/effect/errors";

export interface TokenCheckInput {
  readonly authHeader: string | null | undefined;
  readonly expectedToken: string;
}

const BEARER_PATTERN = /^Bearer (.+)$/;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function requireIngestToken({
  authHeader,
  expectedToken,
}: TokenCheckInput): Effect.Effect<string, UnauthorizedError> {
  if (!authHeader) {
    return Effect.fail(
      new UnauthorizedError({ reason: "missing authorization header" }),
    );
  }
  const match = BEARER_PATTERN.exec(authHeader);
  if (!match) {
    return Effect.fail(
      new UnauthorizedError({ reason: "invalid authorization header" }),
    );
  }
  const token = match[1];
  if (!constantTimeEqual(token, expectedToken)) {
    return Effect.fail(
      new UnauthorizedError({ reason: "invalid bearer token" }),
    );
  }
  return Effect.succeed(token);
}
