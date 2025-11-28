/** @format */

import { describe, it, expect } from "vitest";

describe("Chat Session Functions", () => {
  it("should have createSession function", async () => {
    const { createSession } = await import("./sessions");
    expect(typeof createSession).toBe("function");
  });

  it("should have getSession function", async () => {
    const { getSession } = await import("./sessions");
    expect(typeof getSession).toBe("function");
  });

  it("should have listSessions function", async () => {
    const { listSessions } = await import("./sessions");
    expect(typeof listSessions).toBe("function");
  });

  it("should have deleteSession function", async () => {
    const { deleteSession } = await import("./sessions");
    expect(typeof deleteSession).toBe("function");
  });

  it("should have touchSession function", async () => {
    const { touchSession } = await import("./sessions");
    expect(typeof touchSession).toBe("function");
  });

  it("should have updateSessionTitle function", async () => {
    const { updateSessionTitle } = await import("./sessions");
    expect(typeof updateSessionTitle).toBe("function");
  });

  it("should export SessionNotFoundError", async () => {
    const { SessionNotFoundError } = await import("./sessions");
    expect(SessionNotFoundError).toBeDefined();
    const error = new SessionNotFoundError("test-id");
    expect(error.name).toBe("SessionNotFoundError");
    expect(error.message).toContain("test-id");
  });

  it("should export SessionPermissionError", async () => {
    const { SessionPermissionError } = await import("./sessions");
    expect(SessionPermissionError).toBeDefined();
    const error = new SessionPermissionError("session-id", "user-id");
    expect(error.name).toBe("SessionPermissionError");
    expect(error.message).toContain("session-id");
    expect(error.message).toContain("user-id");
  });
});
