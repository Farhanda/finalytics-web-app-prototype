const stats = [
  { value: "2.4k+", label: "Teams automating with autom8" },
  { value: "1.2M", label: "Tasks shipped on time" },
  { value: "38%", label: "Less time in status meetings" },
  { value: "99.9%", label: "Uptime, every month" },
];

export function StatsBand() {
  return (
    <section className="bg-foreground text-background">
      <div className="container-padded py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-background/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
