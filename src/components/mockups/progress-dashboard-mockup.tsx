import {
  ArrowDown,
  ArrowUp,
  Box,
  Eye,
  Headphones,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { invoices, type InvoiceStatus } from "@/lib/data";

const statusStyles: Record<InvoiceStatus, string> = {
  Completed: "bg-emerald-100 text-emerald-700",
  Cancel: "bg-rose-100 text-rose-600",
  Pending: "bg-amber-100 text-amber-700",
};

const stats = [
  {
    label: "Team Member",
    value: "24",
    delta: "8",
    up: true,
    icon: Users,
  },
  {
    label: "Total Project",
    value: "12",
    delta: "2",
    up: false,
    icon: Box,
  },
  {
    label: "Total Roles",
    value: "8",
    delta: null,
    up: true,
    icon: Headphones,
  },
];

export function ProgressDashboardMockup() {
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
                <stat.icon className="size-5" />
              </span>
              <span className="font-semibold text-foreground">{stat.label}</span>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <span className="font-heading text-3xl font-extrabold text-foreground">
                {stat.value}
              </span>
              {stat.delta && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                    stat.up
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-600"
                  )}
                >
                  {stat.up ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {stat.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task management table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-slate-900/5">
        <div className="px-6 py-5">
          <h4 className="font-heading text-lg font-bold text-foreground">
            Task Management
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-y border-border/70 text-xs font-semibold text-muted-foreground">
                <th className="px-6 py-3 font-semibold">
                  <span className="inline-flex items-center gap-3">
                    <span className="size-4 rounded border border-muted-foreground/30" />
                    Invoice ID
                  </span>
                </th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Due Date</th>
                <th className="px-3 py-3 font-semibold">PIC</th>
                <th className="px-3 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-3 font-medium text-foreground">
                      <span className="size-4 rounded border border-muted-foreground/30" />
                      {invoice.id}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2.5 py-1 text-xs font-medium",
                        statusStyles[invoice.status]
                      )}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">
                    {invoice.dueDate}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{invoice.pic}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Eye className="size-3.5" />
                      </span>
                      <span className="grid size-7 place-items-center rounded-md bg-accent text-primary">
                        <Pencil className="size-3.5" />
                      </span>
                      <span className="grid size-7 place-items-center rounded-md bg-rose-50 text-rose-500">
                        <Trash2 className="size-3.5" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
