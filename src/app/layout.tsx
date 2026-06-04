import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakartaHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "autom8 — Automate your projects, end to end | by Finalytics",
  description:
    "autom8 is the project automation platform by Finalytics. Assign tasks with clarity, track real-time progress, and keep clients in the loop — all in one workspace.",
  keywords: [
    "project management",
    "task automation",
    "team workflow",
    "Finalytics",
    "autom8",
  ],
  openGraph: {
    title: "autom8 — Automate your projects, end to end",
    description:
      "Assign tasks, track real-time progress, and keep clients in the loop. The project automation platform by Finalytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jakartaHeading.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
