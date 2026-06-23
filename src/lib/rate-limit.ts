// Minimal in-memory fixed-window rate limiter for expensive/abusable routes
// (chiefly the paid Claude call in generate-tasks).
//
// LIMITATION: state lives in the process, so on a multi-instance / serverless
// deployment each instance counts independently — this is a speed bump, not a
// hard global cap. For a strict global limit, back it with a shared store
// (e.g. Upstash Redis) behind the same `checkRateLimit` signature. Good enough
// to stop a single client from hammering the endpoint.

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

export type RateResult =
  | { ok: true }
  | { ok: false; response: Response };

// Allow `limit` calls per `windowMs` for a given key. Returns a 429 Response
// (with Retry-After) when the window is exhausted.
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateResult {
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: `Rate limit reached. Try again in ${retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      ),
    };
  }

  existing.count += 1;
  return { ok: true };
}

// Opportunistically drop expired windows so the map can't grow without bound on
// a long-lived process. Cheap; called from the limiter's hot path occasionally.
export function sweepRateLimits(now: number = Date.now()): void {
  for (const [key, w] of buckets) if (now >= w.resetAt) buckets.delete(key);
}
