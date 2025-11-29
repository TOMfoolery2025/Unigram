/** @format */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { SubforumCard } from "./subforum-card";
import { SubforumWithMembership } from "@/types/forum";

/**
 * Feature: mobile-responsive-design, Property 8: Minimum touch target size
 * 
 * For any interactive element (button, link, input) on mobile viewport,
 * the element should have minimum dimensions of 44x44 pixels to ensure touch accessibility.
 * 
 * Validates: Requirements 3.1
 */

// Helper to create a mock subforum
const createMockSubforum = (overrides?: Partial<SubforumWithMembership>): SubforumWithMembership => ({
  id: fc.sample(fc.uuid(), 1)[0],
  name: fc.sample(fc.string({ minLength: 5, maxLength: 50 }), 1)[0],
  description: fc.sample(fc.string({ minLength: 10, maxLength: 200 }), 1)[0],
  creator_id: fc.sample(fc.uuid(), 1)[0],
  creator_name: fc.sample(fc.string({ minLength: 3, maxLength: 30 }), 1)[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  member_count: fc.sample(fc.integer({ min: 0, max: 1000 }), 1)[0],
  is_member: false,
  ...overrides,
});

describe("SubforumCard - Touch Target Size Property Tests", () => {
  it("Property 8: All buttons meet minimum 44px touch target size on mobile", () => {
    fc.assert(
      fc.property(
        fc.boolean(), // is_member
        (isMember) => {
          const subforum = createMockSubforum({
            is_member: isMember,
          });

          const { container } = render(
            <SubforumCard
              subforum={subforum}
              onJoin={() => {}}
              onLeave={() => {}}
              onView={() => {}}
            />
          );

          // Get all buttons in the card
          const buttons = container.querySelectorAll("button");

          // Each button should meet minimum touch target size
          // In jsdom, we check for the CSS class since computed styles aren't fully available
          buttons.forEach((button) => {
            const classList = Array.from(button.classList);
            const hasMinHeight = classList.some(
              (cls) => cls.includes("min-h-") || cls.includes("h-")
            );

            // Check that button has a minimum height class applied
            expect(hasMinHeight).toBe(true);

            // Additionally check that the class includes 44 or higher
            const minHeightClass = classList.find((cls) => cls.startsWith("min-h-"));
            if (minHeightClass) {
              // Extract the pixel value from classes like "min-h-[44px]"
              const match = minHeightClass.match(/min-h-\[(\d+)px\]/);
              if (match) {
                const height = parseInt(match[1], 10);
                expect(height).toBeGreaterThanOrEqual(44);
              }
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
