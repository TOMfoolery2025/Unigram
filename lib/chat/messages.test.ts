/** @format */

import { describe, it, expect } from "vitest";

describe("Chat Message Functions", () => {
  it("should have saveMessage function", async () => {
    const { saveMessage } = await import("./messages");
    expect(typeof saveMessage).toBe("function");
  });

  it("should have getMessages function", async () => {
    const { getMessages } = await import("./messages");
    expect(typeof getMessages).toBe("function");
  });

  it("should have getMessage function", async () => {
    const { getMessage } = await import("./messages");
    expect(typeof getMessage).toBe("function");
  });

  it("should have getMessageCount function", async () => {
    const { getMessageCount } = await import("./messages");
    expect(typeof getMessageCount).toBe("function");
  });

  it("should have deleteMessage function", async () => {
    const { deleteMessage } = await import("./messages");
    expect(typeof deleteMessage).toBe("function");
  });

  it("should have getLatestMessage function", async () => {
    const { getLatestMessage } = await import("./messages");
    expect(typeof getLatestMessage).toBe("function");
  });

  it("should have saveMessages function", async () => {
    const { saveMessages } = await import("./messages");
    expect(typeof saveMessages).toBe("function");
  });

  it("should export MessageNotFoundError", async () => {
    const { MessageNotFoundError } = await import("./messages");
    expect(MessageNotFoundError).toBeDefined();
    const error = new MessageNotFoundError("test-id");
    expect(error.name).toBe("MessageNotFoundError");
    expect(error.message).toContain("test-id");
  });
});
