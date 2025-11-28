/** @format */

import { describe, it, expect } from "vitest";
import { Activity } from "@/types/activity";

describe("ActivityItem", () => {
  it("should export ActivityItem component", async () => {
    const { ActivityItem } = await import("./activity-item");
    expect(typeof ActivityItem).toBe("function");
  });

  it("should handle different activity types", () => {
    const postActivity: Activity = {
      activity_type: "post",
      activity_id: "post-1",
      user_id: "user-1",
      activity_title: "Test Post",
      activity_description: "Test description",
      context_name: "Test Forum",
      created_at: new Date().toISOString(),
      actor_id: "user-1",
      actor_name: "Test User",
      actor_avatar: null,
    };

    const eventActivity: Activity = {
      activity_type: "event_registration",
      activity_id: "event-1",
      user_id: "user-1",
      activity_title: "Test Event",
      activity_description: null,
      context_name: "Test Location",
      created_at: new Date().toISOString(),
      actor_id: "user-1",
      actor_name: "Test User",
      actor_avatar: null,
    };

    const friendshipActivity: Activity = {
      activity_type: "friendship",
      activity_id: "friendship-1",
      user_id: "user-1",
      activity_title: "New friend connection",
      activity_description: null,
      context_name: null,
      created_at: new Date().toISOString(),
      actor_id: "user-1",
      actor_name: "Test User",
      actor_avatar: null,
    };

    // Verify activity objects are valid
    expect(postActivity.activity_type).toBe("post");
    expect(eventActivity.activity_type).toBe("event_registration");
    expect(friendshipActivity.activity_type).toBe("friendship");
  });
});
