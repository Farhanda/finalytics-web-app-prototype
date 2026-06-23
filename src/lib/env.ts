// Central environment-variable catalog + validation.
//
// Until now each service computed its own `xReady` flag from `process.env` in
// isolation (firebase.ts, firebase-admin.ts, ai.ts, discord.ts, github-app.ts,
// api-auth.ts), so there was no single place to see "what is configured and what
// is missing." This module is that catalog: a pure, framework-free description of
// every env var the app reads, grouped by feature, plus a `checkEnv()` that turns
// a given environment into a structured readiness report.
//
// It's intentionally dependency-free and takes the environment as an argument so
// it can be unit-tested without touching the real process.env.

export type EnvFeature = {
  /** Short stable id. */
  key: string;
  /** Human-readable feature name. */
  label: string;
  /** True = needed for a secure production deploy; false = optional integration. */
  required: boolean;
  /** Env vars that must ALL be present for the feature to be ready. */
  vars: string[];
  /** Optional "at least one of these must be present" slot (e.g. a fallback id). */
  oneOf?: string[];
  /** One-line hint shown in the formatted report. */
  note?: string;
};

// The single source of truth. Mirrors the flags previously scattered across the
// service modules — keep this in step with `.env.example`.
export const ENV_FEATURES: EnvFeature[] = [
  {
    key: "firebase-web",
    label: "Firebase Web SDK (client)",
    required: true,
    vars: ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
    note: "Auth + Firestore in the browser. Without it the app shows a 'configure' state.",
  },
  {
    key: "firebase-admin",
    label: "Firebase Admin SDK (server)",
    required: true,
    vars: ["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
    oneOf: ["FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
    note: "Verifies ID tokens on API routes + privileged writes. Required in production.",
  },
  {
    key: "autom8-cli",
    label: "autom8 CLI token",
    required: true,
    vars: ["AUTOM8_API_TOKEN"],
    note: "Bearer token the task-sync CLI (scripts/autom8.mjs) sends to /api/tasks*.",
  },
  {
    key: "anthropic",
    label: "Anthropic (AI task drafting)",
    required: false,
    vars: ["ANTHROPIC_API_KEY"],
    note: "Optional: powers /generate-tasks. Route returns 503 when unset.",
  },
  {
    key: "discord",
    label: "Discord daily report",
    required: false,
    vars: ["DISCORD_WEBHOOK_URL"],
    note: "Optional: target for the daily report. Report no-ops when unset.",
  },
  {
    key: "github-app",
    label: "GitHub App (issues + webhooks)",
    required: false,
    vars: ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY"],
    note: "Optional: two-way GitHub Issues sync. GITHUB_APP_WEBHOOK_SECRET enables push webhooks.",
  },
];

export type FeatureStatus = EnvFeature & {
  ready: boolean;
  /** Vars (and any unsatisfied oneOf slot) that are missing. */
  missing: string[];
};

export type EnvReport = {
  features: FeatureStatus[];
  /** True when every REQUIRED feature is ready. */
  ready: boolean;
  /** Flattened missing vars across the required features only. */
  missingRequired: string[];
};

function isSet(env: NodeJS.ProcessEnv, name: string): boolean {
  const v = env[name];
  return typeof v === "string" && v.trim().length > 0;
}

// Turn an environment into a structured readiness report. Pure — pass any env
// object; defaults to the live process.env.
export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const features: FeatureStatus[] = ENV_FEATURES.map((f) => {
    const missing = f.vars.filter((v) => !isSet(env, v));
    const oneOfOk = !f.oneOf || f.oneOf.some((v) => isSet(env, v));
    if (!oneOfOk) missing.push(f.oneOf!.join(" | "));
    return { ...f, ready: missing.length === 0, missing };
  });

  const missingRequired = features
    .filter((f) => f.required && !f.ready)
    .flatMap((f) => f.missing);

  return {
    features,
    ready: missingRequired.length === 0,
    missingRequired,
  };
}

// A human-readable multi-line summary — handy to log on server startup or print
// from a setup script.
export function formatEnvReport(report: EnvReport): string {
  const lines = report.features.map((f) => {
    const mark = f.ready ? "✓" : f.required ? "✗" : "·";
    const tail = f.ready ? "" : ` — missing: ${f.missing.join(", ")}`;
    return `  ${mark} ${f.label}${f.required ? " (required)" : ""}${tail}`;
  });
  const header = report.ready
    ? "Environment: all required features configured."
    : `Environment: missing required vars → ${report.missingRequired.join(", ")}`;
  return [header, ...lines].join("\n");
}
