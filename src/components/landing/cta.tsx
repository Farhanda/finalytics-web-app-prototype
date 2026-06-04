import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container-padded">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-xl shadow-primary/20 sm:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_55%)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to automate your projects?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/85">
              Join thousands of teams shipping on time with autom8. Start free — no
              credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-7 text-base font-semibold"
              >
                Start for free
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                className="h-12 border border-primary-foreground/30 bg-transparent px-7 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
              >
                Talk to sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
