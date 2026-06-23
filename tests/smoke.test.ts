import { describe, expect, it } from "vitest";

describe("toolchain smoke", () => {
  it("runs and resolves the @ alias", async () => {
    const mod = await import("@/lib/utils");
    expect(typeof mod.cn).toBe("function");
  });
});
