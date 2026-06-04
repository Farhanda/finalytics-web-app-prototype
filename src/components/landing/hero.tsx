import Link from "next/link";
import { ArrowRight, CheckCircle2, Play, Star, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProjectStatusMockup } from "@/components/mockups/project-status-mockup";

const trustPoints = ["No credit card required", "14-day free trial", "Cancel anytime"];

const avatars = [
  "bg-sky-200 text-sky-800",
  "bg-rose-200 text-rose-800",
  "bg-amber-200 text-amber-800",
  "bg-emerald-200 text-emerald-800",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.025),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
      </div>

      <div className="container-padded pt-20 pb-16 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="inline-flex items-center gap-1 text-primary">
              <Star className="size-3.5 fill-primary" /> New
            </span>
            Real-time project tracking is here
          </span>

          <h1 className="mt-6 text-balance font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Automate your projects,{" "}
            <span className="text-primary">end to end.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            autom8 by Finalytics brings task assignment, real-time progress, and
            client-ready status updates into one workspace — so your team always
            knows what to ship next.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 px-7 text-base font-semibold shadow-md shadow-primary/30"
              )}
            >
              Start for free
              <ArrowRight className="size-4" />
            </Link>
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
        <div className="relative mx-auto mt-16 max-w-3xl sm:mt-20">
          {/* Platform glow */}
          <div className="absolute -inset-x-10 -top-10 bottom-10 -z-10 rounded-[2.5rem] bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />

          <ProjectStatusMockup />

          {/* Floating accent chips — hang off the top corners (clear of card content),
              shown only where there's room beside the card. */}
          <div className="absolute -top-6 -left-3 z-10 hidden items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 shadow-lg shadow-slate-900/10 ring-1 ring-black/[0.03] lg:flex">
            <div className="flex -space-x-2">
              {avatars.map((tint, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-[9px] font-bold ring-2 ring-card",
                    tint
                  )}
                >
                  {["SK", "VS", "LM", "EJ"][i]}
                </span>
              ))}
            </div>
            <div className="pr-1 text-left">
              <p className="text-sm font-semibold leading-none text-foreground">
                24 active
              </p>
              <p className="mt-1 text-xs text-muted-foreground">collaborators</p>
            </div>
          </div>

          <div className="absolute -top-6 -right-3 z-10 hidden items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 shadow-lg shadow-slate-900/10 ring-1 ring-black/[0.03] lg:flex">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
              <TrendingUp className="size-[18px]" />
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold leading-none text-foreground">
                98% on-time
              </p>
              <p className="mt-1 text-xs text-muted-foreground">delivery rate</p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-col items-center gap-3 sm:mt-20">
          <div className="flex -space-x-2.5">
            {avatars.concat(["bg-violet-200 text-violet-800"]).map((tint, i) => (
              <span
                key={i}
                className={cn(
                  "grid size-9 place-items-center rounded-full text-[11px] font-bold ring-2 ring-background",
                  tint
                )}
              >
                {["SK", "VS", "LM", "EJ", "OT"][i]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="flex text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-primary" />
              ))}
            </span>
            <span>
              Loved by <span className="font-semibold text-foreground">2,400+</span>{" "}
              teams worldwide
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
