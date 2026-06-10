// GitHub App write-back (server-only).
//
// When the webhook links a commit to a task, we can report back to GitHub:
//   - a commit STATUS ("autom8 — Linked AUT-12 (Completed)")
//   - a commit COMMENT listing the linked tasks
//
// This requires the GitHub App's credentials (so we can mint an installation
// token) plus these App permissions: Commit statuses → Read & write, Contents →
// Read & write (for commit comments). Until GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY
// are set, `githubAppReady` is false and the webhook simply skips write-back.

import { App } from "octokit";

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const githubAppReady = Boolean(appId && privateKey);

let cached: App | null = null;
function getApp(): App | null {
  if (!githubAppReady) return null;
  if (!cached) cached = new App({ appId: appId!, privateKey: privateKey! });
  return cached;
}

type Repo = { owner: string; repo: string };

export function splitFullName(fullName: string): Repo | null {
  const [owner, repo] = (fullName ?? "").split("/");
  return owner && repo ? { owner, repo } : null;
}

// Best-effort write-back; never throws into the webhook flow.
export async function reportCommitFeedback(opts: {
  installationId: number;
  owner: string;
  repo: string;
  sha: string;
  description: string;
  comment?: string;
}): Promise<void> {
  const app = getApp();
  if (!app) return;

  try {
    const octokit = await app.getInstallationOctokit(opts.installationId);

    await octokit.rest.repos.createCommitStatus({
      owner: opts.owner,
      repo: opts.repo,
      sha: opts.sha,
      state: "success",
      context: "autom8",
      description: opts.description.slice(0, 140),
    });

    if (opts.comment) {
      await octokit.rest.repos.createCommitComment({
        owner: opts.owner,
        repo: opts.repo,
        commit_sha: opts.sha,
        body: opts.comment,
      });
    }
  } catch (err) {
    console.error("[github-app] write-back failed", err);
  }
}
