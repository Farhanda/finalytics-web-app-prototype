// GET /api/integration/status — small public status for the Settings card.
// Reveals only whether things are configured, never the token itself.

import { adminReady } from "@/lib/firebase-admin";
import { apiTokenSet } from "@/lib/api-auth";

export const runtime = "nodejs";

export function GET() {
  return Response.json({
    ok: true,
    tokenSet: apiTokenSet,
    storage: adminReady ? "admin" : "client",
  });
}
