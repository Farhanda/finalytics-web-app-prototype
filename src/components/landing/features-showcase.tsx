import {
  Activity,
  BellRing,
  CheckCircle2,
  Filter,
  Gauge,
  LayoutList,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TaskTableMockup } from "@/components/mockups/task-table-mockup";
import { ProgressDashboardMockup } from "@/components/mockups/progress-dashboard-mockup";
import { ProjectStatusMockup } from "@/components/mockups/project-status-mockup";

type Feature = {
  eyebrow: string;
  title: string;
  description: string;
  points: { icon: LucideIcon; text: string }[];
  visual: React.ReactNode;
  reverse?: boolean;
};

const features: Feature[] = [
  {
    eyebrow: "Task Assignment",
    title: "Assign work with total clarity",
    description:
      "Turn vague to-dos into owned, dated, prioritized tasks. Everyone sees who's doing what, when it's due, and where it stands — no status meetings required.",
    points: [
      { icon: Users, text: "One owner per task, with avatars at a glance" },
      { icon: LayoutList, text: "Due dates, statuses, and priority in one row" },
      { icon: Filter, text: "Search and filter across every project instantly" },
    ],
    visual: <TaskTableMockup />,
  },
  {
    eyebrow: "Real-Time Progress",
    title: "See progress as it happens",
    description:
      "A live command center for your whole team. Track members, projects, and roles up top, then drill into the work that needs attention — updated the moment anything changes.",
    points: [
      { icon: Gauge, text: "Headline metrics with up / down trends" },
      { icon: Activity, text: "Live task and invoice status, always current" },
      { icon: BellRing, text: "Get nudged before anything slips past due" },
    ],
    visual: <ProgressDashboardMockup />,
    reverse: true,
  },
  {
    eyebrow: "Project Status",
    title: "Keep clients in the loop",
    description:
      "Share a polished, stage-by-stage view of every project. Clients watch it move from UI/UX to deployed in real time, with payment status and shipping dates built right in.",
    points: [
      { icon: CheckCircle2, text: "Visual stages from kickoff to launch" },
      { icon: Share2, text: "Client-ready links — no logins to manage" },
      { icon: BellRing, text: "Estimated delivery dates kept up to date" },
    ],
    visual: <ProjectStatusMockup />,
  },
];

export function FeaturesShowcase() {
  return (
    <section id="features" className="scroll-mt-20 overflow-hidden py-24 sm:py-28">
      <div className="container-padded">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
            Everything in one place
          </span>
          <h2 className="mt-4 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            The tools your team needs to ship on time
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Three connected workspaces that take a project from first task to final
            delivery — without the spreadsheet sprawl.
          </p>
        </div>

        <div className="mt-20 space-y-24">
          {features.map((feature) => (
            <div
              key={feature.eyebrow}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={cn("min-w-0", feature.reverse && "lg:order-2")}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {feature.eyebrow}
                </span>
                <h3 className="mt-4 text-balance font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-4 text-pretty text-base text-muted-foreground">
                  {feature.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {feature.points.map((point) => (
                    <li key={point.text} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-primary">
                        <point.icon className="size-3.5" />
                      </span>
                      <span className="text-sm text-foreground">{point.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn("relative min-w-0", feature.reverse && "lg:order-1")}>
                <div
                  className={cn(
                    "absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br blur-2xl",
                    feature.reverse
                      ? "from-primary/10 via-transparent to-primary/5"
                      : "from-primary/5 via-transparent to-primary/10"
                  )}
                />
                {feature.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
