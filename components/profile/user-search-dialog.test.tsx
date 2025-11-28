/** @format */

import { describe, it, expect } from "vitest";

describe("UserSearchDialog", () => {
  it("should export UserSearchDialog component", async () => {
    const { UserSearchDialog } = await import("./user-search-dialog");
    expect(typeof UserSearchDialog).toBe("function");
  });
});
