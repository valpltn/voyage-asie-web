import type { TripStat } from "../lib/types";
import { EditButton } from "./EditButton";

export function TripStats({ onEdit, stats }: { onEdit?: () => void; stats: TripStat[] }) {
  return (
    <section className="stats editable-region" aria-label="Synthese du voyage">
      {onEdit && <EditButton label="Modifier les statistiques" onClick={onEdit} />}
      {stats.map((stat) => (
        <div className="stat" key={`${stat.value}-${stat.label}`}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
