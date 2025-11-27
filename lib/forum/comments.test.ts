/** @format */

import { describe, it, expect } from "vitest";

describe("Comment Functions", () => {
  it("should have createComment function", async () => {
    const { createComment } = await import("./comments");
    expect(typeof createComment).toBe("function");
  });

  it("should have getComment function", async () => {
    const { getComment } = await import("./comments");
    expect(typeof getComment).toBe("function");
  });

  it("should have getPostComments function", async () => {
    const { getPostComments } = await import("./comments");
    expect(typeof getPostComments).toBe("function");
  });

  it("should have updateComment function", async () => {
    const { updateComment } = await import("./comments");
    expect(typeof updateComment).toBe("function");
  });

  it("should have deleteComment function", async () => {
    const { deleteComment } = await import("./comments");
    expect(typeof deleteComment).toBe("function");
  });

  it("should have getPostCommentCount function", async () => {
    const { getPostCommentCount } = await import("./comments");
    expect(typeof getPostCommentCount).toBe("function");
  });
});
