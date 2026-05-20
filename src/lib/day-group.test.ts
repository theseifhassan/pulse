import { describe, expect, it } from "vitest";
import { groupByDay } from "~/lib/day-group";

const NOW = new Date("2026-05-20T12:00:00Z");

interface Item {
  readonly createdAt: string;
  readonly readAt: string | null;
}

describe("groupByDay", () => {
  it("groups consecutive same-day items together", () => {
    const items: Item[] = [
      { createdAt: "2026-05-20T11:00:00Z", readAt: null },
      { createdAt: "2026-05-20T09:00:00Z", readAt: null },
      { createdAt: "2026-05-19T22:00:00Z", readAt: null },
    ];
    const out = groupByDay(items, "feed", NOW);
    expect(out).toHaveLength(2);
    expect(out[0].label).toBe("TODAY");
    expect(out[0].items).toHaveLength(2);
    expect(out[1].label).toBe("YESTERDAY");
    expect(out[1].items).toHaveLength(1);
  });

  it("labels older days with weekday · month · day", () => {
    const items: Item[] = [{ createdAt: "2026-05-15T08:00:00Z", readAt: null }];
    const out = groupByDay(items, "feed", NOW);
    expect(out[0].label).toMatch(/^[A-Z]{3} · [A-Z]{3} \d{2}$/);
  });

  it("uses readAt as the day stamp for archived items", () => {
    const items: Item[] = [
      {
        createdAt: "2026-05-15T08:00:00Z",
        readAt: "2026-05-20T08:00:00Z",
      },
    ];
    const out = groupByDay(items, "archived", NOW);
    expect(out[0].label).toBe("TODAY");
  });

  it("preserves item order within each group", () => {
    const items: Item[] = [
      { createdAt: "2026-05-20T11:00:00Z", readAt: null },
      { createdAt: "2026-05-20T10:00:00Z", readAt: null },
      { createdAt: "2026-05-20T09:00:00Z", readAt: null },
    ];
    const out = groupByDay(items, "feed", NOW);
    expect(out[0].items.map((i) => i.createdAt)).toEqual([
      "2026-05-20T11:00:00Z",
      "2026-05-20T10:00:00Z",
      "2026-05-20T09:00:00Z",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(groupByDay([], "feed", NOW)).toEqual([]);
  });
});
