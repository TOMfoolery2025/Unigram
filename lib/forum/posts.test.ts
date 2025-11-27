/** @format */

import { describe, it, expect } from "vitest";

describe("Post Functions", () => {
  it("should have createPost function", async () => {
    const { createPost } = await import("./posts");
    expect(typeof createPost).toBe("function");
  });

  it("should have getPost function", async () => {
    const { getPost } = await import("./posts");
    expect(typeof getPost).toBe("function");
  });

  it("should have getSubforumPosts function", async () => {
    const { getSubforumPosts } = await import("./posts");
    expect(typeof getSubforumPosts).toBe("function");
  });

  it("should have updatePost function", async () => {
    const { updatePost } = await import("./posts");
    expect(typeof updatePost).toBe("function");
  });

  it("should have deletePost function", async () => {
    const { deletePost } = await import("./posts");
    expect(typeof deletePost).toBe("function");
  });

  it("should have searchPosts function", async () => {
    const { searchPosts } = await import("./posts");
    expect(typeof searchPosts).toBe("function");
  });
});
