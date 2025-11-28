/** @format */

import { describe, it, expect } from "vitest";

describe("ActivityFilters", () => {
  it("should export ActivityFiltersComponent", async () => {
    const { ActivityFiltersComponent } = await import("./activity-filters");
    expect(typeof ActivityFiltersComponent).toBe("function");
  });

  it("should export from index", async () => {
    const { ActivityFilters } = await import("./index");
    expect(typeof ActivityFilters).toBe("function");
  });
});
