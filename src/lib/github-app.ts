// Server-only GitHub App integration (two-way Issues sync).
//
// Authenticates as the Autom8 GitHub App to:
//   • createIssue()          — open an Issue for a task (Autom8 → GitHub)
//   • listAccessibleRepos()  — the repos the App can reach, for the project picker
//   • parseIssuesPayload()   — read the App's `issues` webhook (GitHub → Autom8)
//
// Credentials are server-only env (never shipped to the browser):
//   GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_WEBHOOK_SECRET
// `githubAppReady` gates issue creation + repo listing; `githubWebhookReady`
// gates the webhook receiver. Callers degrade gracefully (HTTP 503) when unset,
// mirroring `adminReady` (firebase-admin.ts) and `aiReady` (ai.ts).

import { App } from "octokit";

import { verifyGithubSignature } from "./github";

const appId = process.env.GITHUB_APP_ID;
// Env values escape newlines as "\n" — turn them back into real newlines, the
// same handling FIREBASE_PRIVATE_KEY gets in firebase-admin.ts.
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

export const githubAppReady = Boolean(appId && privateKey);
export const githubWebhookReady = Boolean(webhookSecret);
export const githubWebhookSecret = webhookSecret ?? "";

let app: App | null = null;
function getApp(): App | null {
  if (!githubAppReady) return null;
  if (!app) app = new App({ appId: appId as string, privateKey: privateKey as string });
  return app;
}

// Installations are per account, so one lookup covers every repo under an owner.
const installationByOwner = new Map<string, number>();

function splitRepo(repoFullName: string): [string, string] {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo)
    throw new Error(`Invalid repo "${repoFullName}" — expected "owner/repo".`);
  return [owner, repo];
}

// An installation-scoped Octokit for the repo's owner. Resolves the installation
// id dynamically (projects may target different owners) and caches it per owner.
async function installationOctokitFor(owner: string, repo: string) {
  const a = getApp();
  if (!a) return null;
  let id = installationByOwner.get(owner);
  if (id === undefined) {
    const { data } = await a.octokit.request(
      "GET /repos/{owner}/{repo}/installation",
      { owner, repo }
    );
    id = data.id;
    installationByOwner.set(owner, id);
  }
  return a.getInstallationOctokit(id);
}

export type CreatedIssue = { number: number; url: string };

// Open a GitHub Issue in `repoFullName`. Returns null only when the App isn't
// configured (the route maps that to 503); throws on a real failure (repo not
// found, App not installed on the repo) so the caller can record it as failed.
export async function createIssue(args: {
  repoFullName: string;
  title: string;
  body: string;
}): Promise<CreatedIssue | null> {
  if (!githubAppReady) return null;
  const [owner, repo] = splitRepo(args.repoFullName);
  const octokit = await installationOctokitFor(owner, repo);
  if (!octokit)
    throw new Error("GitHub App is not installed on this repository.");
  const { data } = await octokit.request("POST /repos/{owner}/{repo}/issues", {
    owner,
    repo,
    title: args.title,
    body: args.body,
  });
  return { number: data.number, url: data.html_url };
}

// Every "owner/repo" the App can access across its installations, sorted and
// de-duped. Powers the required repo dropdown in the Admin's create-project flow.
export async function listAccessibleRepos(): Promise<string[]> {
  const a = getApp();
  if (!a) return [];
  const names = new Set<string>();
  for await (const { octokit } of a.eachInstallation.iterator()) {
    const repos = (await octokit.paginate("GET /installation/repositories", {
      per_page: 100,
    })) as Array<{ full_name: string }>;
    for (const r of repos) names.add(r.full_name);
  }
  return [...names].sort((x, y) => x.localeCompare(y));
}

export type IssuesEvent = {
  action: string; // "opened" | "closed" | "reopened" | ...
  repoFullName?: string; // repository.full_name
  issueNumber?: number; // issue.number
  issueState?: string; // issue.state ("open" | "closed")
  issueUrl?: string; // issue.html_url
};

// Pull just the fields we act on out of an `issues` webhook payload.
export function parseIssuesPayload(payload: unknown): IssuesEvent {
  const p = payload as {
    action?: string;
    repository?: { full_name?: string };
    issue?: { number?: number; state?: string; html_url?: string };
  };
  return {
    action: String(p?.action ?? ""),
    repoFullName: p?.repository?.full_name,
    issueNumber:
      typeof p?.issue?.number === "number" ? p.issue.number : undefined,
    issueState: p?.issue?.state,
    issueUrl: p?.issue?.html_url,
  };
}

// Re-export the constant-time HMAC verifier so the webhook route imports one place.
export { verifyGithubSignature };
