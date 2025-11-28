/** @format */

import { describe, it, expect } from "vitest";

describe("ActivityFeed", () => {
  it("should export ActivityFeed component", async () => {
    const { ActivityFeed } = await import("./activity-feed");
    expect(typeof ActivityFeed).toBe("function");
  });
});
