// Timestamp normalization.
//
// Stored timestamps moved from client-supplied `Date.now()` millis to Firestore
// `serverTimestamp()` (authoritative server clock — see PATH-TO-PRODUCTION.md).
// On READ a server timestamp comes back as a Firestore `Timestamp` object, not a
// number, and the two SDKs (web vs admin) use different `Timestamp` classes. Old
// documents written before the migration still hold plain numbers, and seed data
// is written as `Timestamp` too.
//
// `Timestampish` is therefore "whatever a timestamp field might hold on read",
// and `toMillis()` collapses any of those shapes to epoch-millis for sorting,
// comparison, and JSON responses to the browser (which still expects a number).

export type Timestampish =
  | number
  | { toMillis(): number } // firebase / firebase-admin Timestamp
  | { seconds: number; nanoseconds?: number } // plain-object Timestamp
  | { _seconds: number; _nanoseconds?: number } // admin Timestamp over JSON
  | null
  | undefined;

export function toMillis(value: Timestampish): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis(): number }).toMillis();
  }
  const obj = value as { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
  if (typeof obj.seconds === "number") {
    return obj.seconds * 1000 + Math.floor((obj.nanoseconds ?? 0) / 1e6);
  }
  if (typeof obj._seconds === "number") {
    return obj._seconds * 1000 + Math.floor((obj._nanoseconds ?? 0) / 1e6);
  }
  return 0;
}

// Convenience for JSON responses: a stored timestamp may legitimately be absent
// (e.g. a webhook that has never delivered) — preserve null instead of coercing
// to 0 so the client can render "never" correctly.
export function toMillisOrNull(value: Timestampish): number | null {
  return value == null ? null : toMillis(value);
}
