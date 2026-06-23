// Pure arithmetic for sequential AUT-N task-key allocation. Extracted from the
// Firestore transaction (allocateTaskKeys in firestore.ts) so the part that must
// never collide or rewind — the key math — is unit-testable without a database.

export function computeTaskKeys(
  storedValue: number,
  floor: number,
  count: number
): { keys: string[]; next: number } {
  // Never go below the counter's stored value (monotonic) nor below the highest
  // key the caller already sees (repairs a lagging/empty counter after seeding).
  const start = Math.max(storedValue, floor, 0);
  const safeCount = Math.max(0, Math.floor(count));
  const end = start + safeCount;
  const keys: string[] = [];
  for (let n = start + 1; n <= end; n++) keys.push(`AUT-${n}`);
  return { keys, next: end };
}
