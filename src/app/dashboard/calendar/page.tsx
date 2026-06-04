"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type Priority, type Task } from "@/lib/data";
import { useDashboard } from "@/components/dashboard/provider";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const priorityChip: Record<Priority, string> = {
  High: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  Medium: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  Low: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
};

function parseDue(s: string): { y: number; m: number; d: number } | null {
  const match = s.match(/^(\d{1,2})\s+(\w+),\s+(\d{4})$/);
  if (!match) return null;
  const m = MONTHS.indexOf(match[2]);
  if (m < 0) return null;
  return { y: Number(match[3]), m, d: Number(match[1]) };
}

function CalendarBoard() {
  const { tasks, openCreate, openEdit } = useDashboard();

  // Start on the month of the first task that has a due date.
  const initial = useMemo(() => {
    for (const t of tasks) {
      const d = parseDue(t.dueDate);
      if (d) return { y: d.y, m: d.m };
    }
    return { y: 2026, m: 5 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [view, setView] = useState(initial);

  const [today, setToday] = useState<{ y: number; m: number; d: number } | null>(
    null
  );
  useEffect(() => {
    const n = new Date();
    setToday({ y: n.getFullYear(), m: n.getMonth(), d: n.getDate() });
  }, []);

  const byDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (const t of tasks) {
      const d = parseDue(t.dueDate);
      if (d && d.y === view.y && d.m === view.m) {
        (map[d.d] ??= []).push(t);
      }
    }
    return map;
  }, [tasks, view]);

  const monthCount = Object.values(byDay).reduce((s, a) => s + a.length, 0);

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (delta: number) =>
    setView((v) => {
      const m = v.m + delta;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });

  const goToday = () => {
    if (today) setView({ y: today.y, m: today.m });
  };

  const isToday = (d: number) =>
    today && today.y === view.y && today.m === view.m && today.d === d;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Calendar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {monthCount} task{monthCount === 1 ? "" : "s"} due in{" "}
            {MONTHS[view.m]} {view.y}
          </p>
        </div>
        <Button size="sm" className="font-semibold" onClick={openCreate}>
          <Plus className="size-4" /> Create Task
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => move(-1)}
              className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => move(1)}
              className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
            <h3 className="ml-1 font-heading text-lg font-bold text-foreground">
              {MONTHS[view.m]} {view.y}
            </h3>
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border/60 text-center text-xs font-semibold text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              <span className="hidden sm:inline">{w}</span>
              <span className="sm:hidden">{w[0]}</span>
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayTasks = day ? byDay[day] ?? [] : [];
            return (
              <div
                key={i}
                className={cn(
                  "min-h-20 border-b border-r border-border/50 p-1.5 sm:min-h-28 sm:p-2",
                  i % 7 === 6 && "border-r-0",
                  !day && "bg-muted/30"
                )}
              >
                {day && (
                  <>
                    <div className="mb-1 flex justify-end">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-semibold",
                          isToday(day)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => openEdit(t)}
                          title={t.name}
                          className={cn(
                            "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium transition-colors",
                            priorityChip[t.priority],
                            t.done && "line-through opacity-60"
                          )}
                        >
                          {t.name}
                        </button>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="block px-1.5 text-[11px] font-medium text-muted-foreground">
                          +{dayTasks.length - 2} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Priority:</span>
        {(["High", "Medium", "Low"] as Priority[]).map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "size-3 rounded-full",
                p === "High" && "bg-rose-400",
                p === "Medium" && "bg-amber-400",
                p === "Low" && "bg-emerald-400"
              )}
            />
            {p}
          </span>
        ))}
        <span className="text-xs">Click a task to edit it.</span>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return <CalendarBoard />;
}
