import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/ forever",
    description: "For small teams getting organized.",
    features: [
      "Up to 5 members",
      "3 active projects",
      "Task assignment & priorities",
      "Basic progress tracking",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Team",
    price: "$12",
    period: "/ user / mo",
    description: "For growing teams that ship together.",
    features: [
      "Unlimited members",
      "Unlimited projects",
      "Real-time dashboards",
      "Client status pages",
      "Due-date reminders",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/ user / mo",
    description: "For agencies managing many clients.",
    features: [
      "Everything in Team",
      "Advanced roles & permissions",
      "Custom project stages",
      "Priority support & SSO",
    ],
    cta: "Contact sales",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-muted/40 py-24 sm:py-28">
      <div className="container-padded">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Pricing
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Simple pricing that scales with you
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, upgrade when your team grows. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm",
                plan.featured
                  ? "border-primary shadow-lg shadow-primary/10 lg:-mt-4 lg:pb-10"
                  : "border-border"
              )}
            >
              {plan.featured && (
                <span className="absolute right-6 top-6 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-heading text-lg font-bold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <Button
                className="mt-6 w-full font-semibold"
                variant={plan.featured ? "default" : "outline"}
              >
                {plan.cta}
              </Button>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-primary">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
