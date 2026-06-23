// GET /api/github/repos
//
// Lists the "owner/repo" the autom8 GitHub App can access across its
// installations. Powers the required repo dropdown when an Admin creates a
// project. Returns 503 (with an empty list) when the App isn't configured.

import { githubAppReady, listAccessibleRepos } from "@/lib/github-app";
import { authorize } from "@/lib/route-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Repo list feeds the Admin's create-project picker. Restrict to Admin/PM.
  const auth = await authorize(req, { roles: ["Admin", "PM"] });
  if (!auth.ok) return auth.response;

  if (!githubAppReady)
    return Response.json(
      {
        ok: false,
        error:
          "GitHub App is not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY, then install the app on your repos.",
        repos: [],
      },
      { status: 503 }
    );

  try {
    const repos = await listAccessibleRepos();
    return Response.json({ ok: true, repos });
  } catch (err) {
    console.error("[github/repos] listing failed", err);
    return Response.json(
      {
        ok: false,
        error: "Could not list repositories from GitHub.",
        repos: [],
      },
      { status: 502 }
    );
  }
}
