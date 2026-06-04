const companies = ["Northwind", "Acme Co", "Lumina", "Vertex", "Quanta", "Helios"];

export function LogoCloud() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container-padded py-10">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Trusted by fast-moving teams at companies of every size
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {companies.map((name) => (
            <span
              key={name}
              className="font-heading text-xl font-bold tracking-tight text-muted-foreground/60"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
