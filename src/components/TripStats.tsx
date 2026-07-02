import type { TripStat } from "../lib/types";

export function TripStats({ stats }: { stats: TripStat[] }) {
  return (
    <section className="stats" aria-label="Synthese du voyage">
      {stats.map((stat) => (
        <div className="stat" key={`${stat.value}-${stat.label}`}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
