/** @format */

import { describe, it, expect } from "vitest";
import { generateAvatarUrl } from "./user-avatar";

describe("UserAvatar", () => {
  it("should export UserAvatar component", async () => {
    const { UserAvatar } = await import("./user-avatar");
    expect(typeof UserAvatar).toBe("function");
  });

  describe("generateAvatarUrl", () => {
    it("should generate consistent DiceBear URLs for the same seed", () => {
      const userId = "test-user-123";
      const url1 = generateAvatarUrl(userId);
      const url2 = generateAvatarUrl(userId);
      
      expect(url1).toBe(url2);
      expect(url1).toContain("dicebear.com");
      expect(url1).toContain(encodeURIComponent(userId));
    });

    it("should generate different URLs for different seeds", () => {
      const url1 = generateAvatarUrl("user-1");
      const url2 = generateAvatarUrl("user-2");
      
      expect(url1).not.toBe(url2);
    });

    it("should use default avataaars style", () => {
      const url = generateAvatarUrl("test-user");
      expect(url).toContain("avataaars");
    });

    it("should support custom styles", () => {
      const url = generateAvatarUrl("test-user", "bottts");
      expect(url).toContain("bottts");
    });

    it("should properly encode special characters in seed", () => {
      const userId = "user@example.com";
      const url = generateAvatarUrl(userId);
      
      expect(url).toContain(encodeURIComponent(userId));
      expect(url).not.toContain("@"); // @ should be encoded
    });
  });
});
