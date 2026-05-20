import { describe, expect, it } from "vitest";
import { classifyRoute } from "~/server/auth/route-policy";

describe("classifyRoute", () => {
  it("classifies /api/ingest as agent", () => {
    expect(classifyRoute("/api/ingest")).toBe("agent");
  });

  it("classifies /api/ingest/anything as agent", () => {
    expect(classifyRoute("/api/ingest/extra")).toBe("agent");
  });

  it("does not classify /api/ingestion as agent (no false-prefix match)", () => {
    expect(classifyRoute("/api/ingestion")).toBe("owner-protected");
  });

  it("classifies /api/feedback as agent (bearer-authed for Layla sync)", () => {
    expect(classifyRoute("/api/feedback")).toBe("agent");
  });

  it("does not classify /api/feedbacks as agent (no false-prefix match)", () => {
    expect(classifyRoute("/api/feedbacks")).toBe("owner-protected");
  });

  it("classifies sign-in and sign-up routes as public", () => {
    expect(classifyRoute("/sign-in")).toBe("public");
    expect(classifyRoute("/sign-in/factor-one")).toBe("public");
    expect(classifyRoute("/sign-up")).toBe("public");
  });

  it("classifies Clerk callback routes as public", () => {
    expect(classifyRoute("/_clerk/callback")).toBe("public");
  });

  it("classifies the main feed view as owner-protected", () => {
    expect(classifyRoute("/")).toBe("owner-protected");
  });

  it("classifies /api/feed/unread as owner-protected", () => {
    expect(classifyRoute("/api/feed/unread")).toBe("owner-protected");
  });

  it("classifies /api/feed/123/feedback as owner-protected", () => {
    expect(classifyRoute("/api/feed/123/feedback")).toBe("owner-protected");
  });
});
