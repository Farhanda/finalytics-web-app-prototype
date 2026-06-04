import { ClipboardList, Rocket, Users2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Plan & assign",
    description:
      "Break the project into tasks, set owners, due dates, and priority. autom8 keeps everything in a single, searchable board.",
  },
  {
    icon: Users2,
    step: "02",
    title: "Track in real time",
    description:
      "Watch progress update live across members, projects, and roles. Spot blockers early and rebalance work before deadlines slip.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Deliver & share",
    description:
      "Move each project through its stages to launch, and share a polished status view that keeps clients informed automatically.",
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-20 bg-muted/40 py-24 sm:py-28">
      <div className="container-padded">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            How it works
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            From kickoff to launch in three steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A workflow your whole team can adopt on day one — no onboarding marathon
            required.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.step}
              className="relative rounded-2xl border border-border bg-card p-7 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary">
                  <step.icon className="size-6" />
                </span>
                <span className="font-heading text-4xl font-extrabold text-muted/80">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
