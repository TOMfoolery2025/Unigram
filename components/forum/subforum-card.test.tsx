/** @format */

import { describe, it, expect } from "vitest";

describe("SubforumCard", () => {
  it("should export SubforumCard component", async () => {
    const { SubforumCard } = await import("./subforum-card");
    expect(typeof SubforumCard).toBe("function");
  });
});
