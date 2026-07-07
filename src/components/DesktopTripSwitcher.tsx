import { useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { Settings } from "lucide-react";
import { formatDateRange } from "../lib/format";
import { getTripImageUrl } from "./TripSwitcher.shared";
import type { TripSwitcherProps } from "./TripSwitcher.shared";

export function DesktopTripSwitcher({
  folders,
  activeFolderId,
  activeTripId,
  onFolderChange,
  onManageTrips,
  onTripChange,
}: TripSwitcherProps) {
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? folders[0];
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const switchTimer = useRef<number | undefined>(undefined);

  function handleCarouselWheel(event: WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  function clearHoverTimers() {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(switchTimer.current);
  }

  function handleCardPointerEnter(tripId: string) {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(switchTimer.current);

    if (!expandedTripId || expandedTripId === tripId) {
      setExpandedTripId(tripId);
      return;
    }

    switchTimer.current = window.setTimeout(() => {
      setExpandedTripId(tripId);
    }, 220);
  }

  function handleCardPointerLeave(event: PointerEvent<HTMLButtonElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;

    window.clearTimeout(switchTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setExpandedTripId(null);
    }, 320);
  }

  return (
    <section className="destination-picker desktop-destination-picker" aria-label="Selection du voyage">
      <div className="picker-heading">
        <div className="folder-tabs" role="tablist" aria-label="Dossiers de voyage">
          {folders.map((folder) => (
            <button
              aria-selected={folder.id === activeFolderId}
              className={`folder-tab ${folder.id === activeFolderId ? "active" : ""}`}
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              role="tab"
              type="button"
            >
              {folder.label}
            </button>
          ))}
        </div>
        {onManageTrips && (
          <button className="plain-btn icon-text-btn manage-trips-btn" onClick={onManageTrips} type="button">
            <Settings aria-hidden="true" size={16} />
            Gerer les voyages
          </button>
        )}
      </div>

      <div className="destination-grid" onWheel={handleCarouselWheel}>
        {activeFolder.trips.map((trip) => {
          const imageUrl = getTripImageUrl(trip.id, trip.imageUrl);
          return (
            <button
              aria-pressed={trip.id === activeTripId}
              className={`destination-card ${trip.id === activeTripId ? "active" : ""} ${
                trip.id === expandedTripId ? "expanded" : ""
              }`}
              key={trip.id}
              onBlur={() => {
                clearHoverTimers();
                setExpandedTripId(null);
              }}
              onClick={() => onTripChange(trip.id)}
              onFocus={() => handleCardPointerEnter(trip.id)}
              onPointerEnter={() => handleCardPointerEnter(trip.id)}
              onPointerLeave={handleCardPointerLeave}
              type="button"
            >
              <span className="destination-photo" style={{ backgroundImage: `url("${imageUrl}")` }} />
              <span className="destination-content">
                <span className="destination-meta">{formatDateRange(trip.startDate, trip.endDate)}</span>
                <strong>{trip.title}</strong>
                <span>{trip.stats.map((stat) => `${stat.value} ${stat.label}`).join(" - ")}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
