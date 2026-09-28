import { describe, expect, it } from "vitest";

describe("T02 account persistence", () => {
  it.todo("creates an account with a unique identifier and zero balance");
  it.todo("reads a persisted account by identifier");

  it("does not claim persistence validation without a database execution environment", () => {
    expect(true).toBe(true);
  });
});
