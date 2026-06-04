import { ArrowRight, CheckCircle2, Play, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectStatusMockup } from "@/components/mockups/project-status-mockup";

const trustPoints = ["No credit card required", "14-day free trial", "Cancel anytime"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent_60%)]" />
      </div>

      <div className="container-padded py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="inline-flex items-center gap-1 text-primary">
              <Star className="size-3.5 fill-primary" /> New
            </span>
            Real-time project tracking is here
          </span>

          <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            Automate your projects,
            <br className="hidden sm:block" />{" "}
            <span className="text-primary">end to end.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            autom8 by Finalytics brings task assignment, real-time progress, and
            client-ready status updates into one workspace — so your team always
            knows what to ship next.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-7 text-base font-semibold shadow-md shadow-primary/30">
              Start for free
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base font-semibold"
            >
              <Play className="size-4" />
              Watch demo
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trustPoints.map((point) => (
              <li key={point} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Hero visual */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute -inset-x-6 -top-6 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
          <ProjectStatusMockup />
        </div>
      </div>
    </section>
  );
}
