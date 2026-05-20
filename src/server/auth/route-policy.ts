export type RouteClass = "agent" | "owner-protected" | "public";

const AGENT_PREFIX = "/api/ingest";
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/_clerk"];

export function classifyRoute(pathname: string): RouteClass {
  if (pathname === AGENT_PREFIX || pathname.startsWith(`${AGENT_PREFIX}/`)) {
    return "agent";
  }
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return "public";
    }
  }
  return "owner-protected";
}
