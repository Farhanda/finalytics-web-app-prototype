import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "autom8 replaced three tools for us. Task assignment, live progress, and the client status page all live in one workspace now — our status meetings basically disappeared.",
    name: "Sean Kemper",
    role: "Head of Delivery, Northwind",
    initials: "SK",
    tint: "bg-sky-100 text-sky-700",
  },
  {
    quote:
      "The real-time dashboard is the first thing my team opens every morning. We catch slipping deadlines days earlier than we used to.",
    name: "Victoria Sullivan",
    role: "Project Lead, Lumina",
    initials: "VS",
    tint: "bg-rose-100 text-rose-700",
  },
  {
    quote:
      "Clients love the project status view. Sharing a clean, stage-by-stage link instead of a long email thread has been a game changer.",
    name: "Liam Martinez",
    role: "Founder, Vertex Studio",
    initials: "LM",
    tint: "bg-amber-100 text-amber-700",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-28">
      <div className="container-padded">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Loved by teams
          </span>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Built for the way modern teams ship
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-full text-sm font-semibold",
                    t.tint
                  )}
                >
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {t.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
