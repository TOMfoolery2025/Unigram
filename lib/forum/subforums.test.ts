/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Simple unit tests for subforum functions
describe("Subforum Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("should have createSubforum function", async () => {
      const { createSubforum } = await import("./subforums");
      expect(typeof createSubforum).toBe("function");
    });

    it("should have getSubforums function", async () => {
      const { getSubforums } = await import("./subforums");
      expect(typeof getSubforums).toBe("function");
    });

    it("should have searchSubforums function", async () => {
      const { searchSubforums } = await import("./subforums");
      expect(typeof searchSubforums).toBe("function");
    });

    it("should have joinSubforum function", async () => {
      const { joinSubforum } = await import("./subforums");
      expect(typeof joinSubforum).toBe("function");
    });

    it("should have leaveSubforum function", async () => {
      const { leaveSubforum } = await import("./subforums");
      expect(typeof leaveSubforum).toBe("function");
    });
  });
});
