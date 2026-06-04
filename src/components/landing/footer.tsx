import { Logo } from "@/components/brand/logo";

const columns = [
  {
    title: "Product",
    links: ["Features", "Workflow", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Customers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Help center", "API", "Status", "Community"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "Cookies"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container-padded py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 max-w-xs sm:col-span-4 lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              The project automation platform by Finalytics. Assign, track, and ship —
              all in one workspace.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 autom8 by Finalytics. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with care for teams that ship.
          </p>
        </div>
      </div>
    </footer>
  );
}
