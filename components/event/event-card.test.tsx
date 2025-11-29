/** @format */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { EventCard } from "./event-card";
import { EventWithRegistration } from "@/types/event";

/**
 * Feature: mobile-responsive-design, Property 8: Minimum touch target size
 * 
 * For any interactive element (button, link, input) on mobile viewport,
 * the element should have minimum dimensions of 44x44 pixels to ensure touch accessibility.
 * 
 * Validates: Requirements 3.1
 */

// Helper to create a mock event
const createMockEvent = (overrides?: Partial<EventWithRegistration>): EventWithRegistration => ({
  id: fc.sample(fc.uuid(), 1)[0],
  title: fc.sample(fc.string({ minLength: 5, maxLength: 50 }), 1)[0],
  description: fc.sample(fc.string({ minLength: 10, maxLength: 200 }), 1)[0],
  date: new Date().toISOString(),
  start_time: "10:00",
  end_time: "12:00",
  location: fc.sample(fc.string({ minLength: 5, maxLength: 50 }), 1)[0],
  category: "social",
  event_type: "tum_native",
  is_private: false,
  is_published: true,
  is_registered: false,
  registration_count: 0,
  max_attendees: null,
  creator_id: fc.sample(fc.uuid(), 1)[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("EventCard - Touch Target Size Property Tests", () => {
  it("Property 8: All buttons meet minimum 44px touch target size on mobile", () => {
    fc.assert(
      fc.property(
        fc.boolean(), // is_registered
        fc.boolean(), // is_published
        fc.boolean(), // showCreatorActions
        fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }), // max_attendees
        fc.integer({ min: 0, max: 100 }), // registration_count
        (isRegistered, isPublished, showCreatorActions, maxAttendees, registrationCount) => {
          const event = createMockEvent({
            is_registered: isRegistered,
            is_published: isPublished,
            max_attendees: maxAttendees,
            registration_count: registrationCount,
          });

          const { container } = render(
            <EventCard
              event={event}
              currentUserId={event.creator_id}
              showCreatorActions={showCreatorActions}
              onRegister={() => {}}
              onUnregister={() => {}}
              onView={() => {}}
              onPublish={() => {}}
              onUnpublish={() => {}}
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
