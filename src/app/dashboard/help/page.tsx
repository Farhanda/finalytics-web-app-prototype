"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Activity, BookOpen, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDashboard } from "@/components/dashboard/provider";

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const resources = [
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "Guides and references for every feature.",
    cta: "Read the docs",
    href: "/#features",
  },
  {
    icon: MessagesSquare,
    title: "Community",
    desc: "Ask questions and share workflows.",
    cta: "Join the community",
    href: "/#faq",
  },
  {
    icon: Activity,
    title: "System status",
    desc: "All systems operational — 99.9% uptime.",
    cta: "View status",
    href: "/#",
  },
];

const faqs = [
  {
    q: "How do I create and assign a task?",
    a: "Click “Create Task” in the top bar or on any task board, fill in the name, assignee, due date, priority, and status, then save. The task appears instantly across the dashboard, calendar, and the assignee's profile.",
  },
  {
    q: "Where do my changes get saved?",
    a: "This prototype stores your tasks, activity, and profile in your browser (localStorage), so changes survive a refresh. Use Settings → Reset demo data to restore the original sample workspace.",
  },
  {
    q: "How does the calendar know when tasks are due?",
    a: "The calendar reads each task's due date and places it on the matching day. Creating or editing a task updates the calendar immediately. Click any task on a day to edit it.",
  },
  {
    q: "What are roles?",
    a: "Roles group your team by what they do. The Roles page is derived from your team members and shows how many people and how much work sits behind each role.",
  },
];

export default function HelpPage() {
  const { profile } = useDashboard();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Add a subject and a message");
      return;
    }
    toast.success("Message sent", {
      description: "Our team will reply to " + profile.email,
    });
    setSubject("");
    setMessage("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Help &amp; support
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Find answers fast, or reach out — we usually reply within a few hours.
        </p>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {resources.map((r) => (
          <div
            key={r.title}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
              <r.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold text-foreground">{r.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.desc}</p>
            <Link
              href={r.href}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              {r.cta} →
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Frequently asked questions
        </h3>
        <Accordion className="mt-2 w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Contact */}
      <form
        onSubmit={send}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h3 className="font-heading text-lg font-bold text-foreground">
          Contact support
        </h3>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{profile.email}</span>
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              rows={4}
              className={fieldClass + " resize-y"}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit" className="font-semibold">
            Send message
          </Button>
        </div>
      </form>
    </div>
  );
}
