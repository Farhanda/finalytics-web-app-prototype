// Server-only Discord integration for Tahap 4: format and send the daily report
// to an Incoming Webhook (the Aixel channel). `discordReady` is false until
// DISCORD_WEBHOOK_URL is set, so callers can preview the report without sending.

export const discordReady = Boolean(process.env.DISCORD_WEBHOOK_URL);

export type DailyReport = {
  windowHours: number;
  dateLabel: string;
  completedTasks: string[];
  completedCount: number;
  projects: {
    name: string;
    total: number;
    divisions: { division: string; count: number }[];
  }[];
  totalCommits: number;
};

const GREEN = 0x10b981;

// Discord caps a field value at 1024 chars and an embed at 6000 — keep lists short.
function bullets(items: string[], max: number): string {
  if (items.length === 0) return "_None_";
  const shown = items.slice(0, max).map((t) => `• ${t}`);
  if (items.length > max) shown.push(`…and ${items.length - max} more`);
  return shown.join("\n").slice(0, 1024);
}

export function buildDailyEmbed(report: DailyReport) {
  const commitsValue =
    report.projects.length === 0
      ? "_None_"
      : report.projects
          .map((p) => {
            const breakdown = p.divisions
              .map((d) => `${d.division} ${d.count}`)
              .join(", ");
            return `**${p.name}** — ${p.total}${
              breakdown ? ` (${breakdown})` : ""
            }`;
          })
          .join("\n")
          .slice(0, 1024);

  return {
    title: "autom8 — Daily report",
    description: `${report.dateLabel} · last ${report.windowHours}h`,
    color: GREEN,
    fields: [
      {
        name: `✅ Completed tasks (${report.completedCount})`,
        value: bullets(report.completedTasks, 15),
      },
      {
        name: `📦 Commits (${report.totalCommits})`,
        value: commitsValue,
      },
    ],
    footer: { text: "autom8" },
  };
}

// POST the embed to the configured Discord webhook. Throws on missing URL or a
// non-2xx response so the route can report failure.
export async function sendDiscordEmbed(embed: unknown): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error("DISCORD_WEBHOOK_URL is not set.");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "autom8", embeds: [embed] }),
  });
  if (!res.ok)
    throw new Error(`Discord webhook responded ${res.status}.`);
}
