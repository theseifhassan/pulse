import { Data } from "effect";
import { NextResponse } from "next/server";

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
  readonly id?: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly resource: string;
  readonly reason: string;
  readonly existingId?: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly reason: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly reason: string;
}> {}

export class RateLimitedError extends Data.TaggedError("RateLimitedError")<{
  readonly retryAfterSeconds: number;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly issues: readonly string[];
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause: unknown;
}> {}

export type AppError =
  | NotFoundError
  | ConflictError
  | UnauthorizedError
  | ForbiddenError
  | RateLimitedError
  | ValidationError
  | DatabaseError;

export function errorToResponse(error: AppError): NextResponse {
  switch (error._tag) {
    case "NotFoundError":
      return NextResponse.json(
        { error: "NotFound", resource: error.resource, id: error.id },
        { status: 404 },
      );
    case "ConflictError":
      return NextResponse.json(
        {
          error: "Conflict",
          resource: error.resource,
          reason: error.reason,
          existingId: error.existingId,
        },
        { status: 409 },
      );
    case "UnauthorizedError":
      return NextResponse.json(
        { error: "Unauthorized", reason: error.reason },
        { status: 401 },
      );
    case "ForbiddenError":
      return NextResponse.json(
        { error: "Forbidden", reason: error.reason },
        { status: 403 },
      );
    case "RateLimitedError":
      return NextResponse.json(
        { error: "RateLimited", retryAfterSeconds: error.retryAfterSeconds },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    case "ValidationError":
      return NextResponse.json(
        { error: "Validation", issues: error.issues },
        { status: 400 },
      );
    case "DatabaseError":
      return NextResponse.json(
        { error: "InternalServerError" },
        { status: 500 },
      );
  }
}
