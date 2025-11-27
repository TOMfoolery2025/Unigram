/** @format */

import { describe, it, expect } from "vitest";

describe("Vote Functions", () => {
  it("should have voteOnPost function", async () => {
    const { voteOnPost } = await import("./votes");
    expect(typeof voteOnPost).toBe("function");
  });

  it("should have removeVote function", async () => {
    const { removeVote } = await import("./votes");
    expect(typeof removeVote).toBe("function");
  });

  it("should have getUserVote function", async () => {
    const { getUserVote } = await import("./votes");
    expect(typeof getUserVote).toBe("function");
  });

  it("should have getPostVotes function", async () => {
    const { getPostVotes } = await import("./votes");
    expect(typeof getPostVotes).toBe("function");
  });

  it("should have getPostVoteStats function", async () => {
    const { getPostVoteStats } = await import("./votes");
    expect(typeof getPostVoteStats).toBe("function");
  });

  it("should have getUserVotesForPosts function", async () => {
    const { getUserVotesForPosts } = await import("./votes");
    expect(typeof getUserVotesForPosts).toBe("function");
  });
});
