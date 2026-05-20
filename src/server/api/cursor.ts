import "server-only";

// Opaque base64url-encoded cursor for cursor-based pagination on
// (timestamp, id) tuples.

export interface Cursor {
  readonly ts: string; // ISO timestamp
  readonly id: string; // uuid
}

export function encodeCursor(cursor: Cursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json, "utf-8").toString("base64url");
}

export function decodeCursor(input: string): Cursor | null {
  try {
    const json = Buffer.from(input, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { ts?: unknown }).ts === "string" &&
      typeof (parsed as { id?: unknown }).id === "string"
    ) {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
