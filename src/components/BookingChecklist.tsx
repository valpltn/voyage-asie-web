import { useMemo, useState } from "react";
import { priorityLabel, statusLabel } from "../lib/format";
import type { BookingPriority, BookingStatus, BookingTask } from "../lib/types";
import { EmptyState } from "./EmptyState";

const priorityFilters: Array<"all" | BookingPriority> = ["all", "high", "medium", "low"];
const statusFilters: Array<"all" | BookingStatus> = ["all", "todo", "booked", "skipped"];

export function BookingChecklist({ bookings }: { bookings: BookingTask[] }) {
  const [priority, setPriority] = useState<"all" | BookingPriority>("all");
  const [status, setStatus] = useState<"all" | BookingStatus>("all");

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          (priority === "all" || booking.priority === priority) &&
          (status === "all" || booking.status === status),
      ),
    [bookings, priority, status],
  );

  if (bookings.length === 0) {
    return <EmptyState title="Aucune reservation" copy="Ajoute des taches de reservation pour suivre la logistique." />;
  }

  return (
    <section className="view active">
      <div className="filterbar" aria-label="Filtres reservations">
        <label>
          Priorite
          <select onChange={(event) => setPriority(event.target.value as "all" | BookingPriority)} value={priority}>
            {priorityFilters.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Toutes" : priorityLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <select onChange={(event) => setStatus(event.target.value as "all" | BookingStatus)} value={status}>
            {statusFilters.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Tous" : statusLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filteredBookings.length === 0 ? (
        <EmptyState title="Aucun resultat" copy="Aucune reservation ne correspond aux filtres actifs." />
      ) : (
        <div className="checklist-grid">
          {filteredBookings.map((booking) => (
            <article className="checklist-card" key={booking.id}>
              <div className="task-meta">
                <span>{booking.category}</span>
                <span>{priorityLabel(booking.priority)}</span>
              </div>
              <h2>{booking.label}</h2>
              <p>
                Statut: {statusLabel(booking.status)}
                {booking.dueDate ? ` | Echeance: ${booking.dueDate}` : ""}
              </p>
              {booking.notes && <p>{booking.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
