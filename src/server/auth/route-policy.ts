export type RouteClass = "agent" | "owner-protected" | "public";

// Routes that authenticate via Bearer INGEST_TOKEN instead of Clerk.
// Clerk middleware skips these so the bearer header isn't parsed as a JWT.
const AGENT_PREFIXES = ["/api/ingest", "/api/feedback"];
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/_clerk"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function classifyRoute(pathname: string): RouteClass {
  for (const prefix of AGENT_PREFIXES) {
    if (matchesPrefix(pathname, prefix)) return "agent";
  }
  for (const prefix of PUBLIC_PREFIXES) {
    if (matchesPrefix(pathname, prefix)) return "public";
  }
  return "owner-protected";
}
