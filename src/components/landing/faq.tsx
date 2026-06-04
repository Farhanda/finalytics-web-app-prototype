import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is autom8?",
    a: "autom8 is the project automation platform by Finalytics. It combines task assignment, real-time progress tracking, and client-ready status pages into a single workspace so your team can take a project from first task to final delivery.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Starter plan is free forever, and every paid plan comes with a 14-day trial — no credit card required. You can upgrade or cancel anytime.",
  },
  {
    q: "Can clients see project progress without an account?",
    a: "Yes. The project status view can be shared as a link, so clients can follow a project from UI/UX to deployed in real time without creating an account or logging in.",
  },
  {
    q: "Does autom8 work for non-technical teams?",
    a: "Absolutely. While it's loved by product and engineering teams, the task board, dashboards, and status pages are designed to be readable by anyone — marketing, ops, agencies, and clients included.",
  },
  {
    q: "How does real-time tracking work?",
    a: "Every update to a task, status, or stage is reflected instantly across dashboards and shared views, so the numbers you see — members, projects, and roles — are always current.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-28">
      <div className="container-padded">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            FAQ
          </span>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
