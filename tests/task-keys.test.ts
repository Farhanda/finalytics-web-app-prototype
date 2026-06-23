import { describe, it, expect } from "vitest";

import { computeTaskKeys } from "@/lib/task-keys";

describe("computeTaskKeys", () => {
  it("allocates a single sequential key after the stored value", () => {
    const { keys, next } = computeTaskKeys(7, 0, 1);
    expect(keys).toEqual(["AUT-8"]);
    expect(next).toBe(8);
  });

  it("allocates a contiguous batch", () => {
    const { keys, next } = computeTaskKeys(10, 0, 3);
    expect(keys).toEqual(["AUT-11", "AUT-12", "AUT-13"]);
    expect(next).toBe(13);
  });

  it("respects the floor when the counter is behind (post-seed repair)", () => {
    // Counter says 2, but the live task list already contains AUT-7 → never reissue.
    const { keys, next } = computeTaskKeys(2, 7, 1);
    expect(keys).toEqual(["AUT-8"]);
    expect(next).toBe(8);
  });

  it("uses the counter when it is ahead of the floor (monotonic)", () => {
    const { keys, next } = computeTaskKeys(20, 5, 2);
    expect(keys).toEqual(["AUT-21", "AUT-22"]);
    expect(next).toBe(22);
  });

  it("starts at 1 from an empty counter and no prior tasks", () => {
    const { keys, next } = computeTaskKeys(0, 0, 2);
    expect(keys).toEqual(["AUT-1", "AUT-2"]);
    expect(next).toBe(2);
  });

  it("returns no keys for a zero/negative count and never rewinds", () => {
    expect(computeTaskKeys(9, 0, 0)).toEqual({ keys: [], next: 9 });
    expect(computeTaskKeys(9, 0, -3)).toEqual({ keys: [], next: 9 });
  });
});
