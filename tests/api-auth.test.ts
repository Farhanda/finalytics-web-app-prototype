// CLI/machine bearer-token check (src/lib/api-auth.ts → isAuthorized).

import { afterEach, describe, expect, it } from "vitest";

import { isAuthorized } from "@/lib/api-auth";

const original = process.env.AUTOM8_API_TOKEN;
afterEach(() => {
  if (original === undefined) delete process.env.AUTOM8_API_TOKEN;
  else process.env.AUTOM8_API_TOKEN = original;
});

const req = (auth?: string) =>
  new Request("http://x", { headers: auth ? { authorization: auth } : {} });

describe("isAuthorized", () => {
  it("accepts a matching bearer token", () => {
    process.env.AUTOM8_API_TOKEN = "secret";
    expect(isAuthorized(req("Bearer secret"))).toBe(true);
  });
  it("is case-insensitive on the Bearer scheme", () => {
    process.env.AUTOM8_API_TOKEN = "secret";
    expect(isAuthorized(req("bearer secret"))).toBe(true);
  });
  it("rejects a wrong token", () => {
    process.env.AUTOM8_API_TOKEN = "secret";
    expect(isAuthorized(req("Bearer nope"))).toBe(false);
  });
  it("rejects a missing Authorization header", () => {
    process.env.AUTOM8_API_TOKEN = "secret";
    expect(isAuthorized(req())).toBe(false);
  });
  it("rejects everything when no server token is configured", () => {
    delete process.env.AUTOM8_API_TOKEN;
    expect(isAuthorized(req("Bearer anything"))).toBe(false);
  });
});
