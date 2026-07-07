import { Settings } from "lucide-react";
import { formatDateRange } from "../lib/format";
import { getTripImageUrl } from "./TripSwitcher.shared";
import type { TripSwitcherProps } from "./TripSwitcher.shared";

export function MobileTripSwitcher({
  folders,
  activeFolderId,
  activeTripId,
  onFolderChange,
  onManageTrips,
  onTripChange,
}: TripSwitcherProps) {
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? folders[0];

  return (
    <section className="destination-picker mobile-destination-picker" aria-label="Selection du voyage">
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

      <div className="destination-grid">
        {activeFolder.trips.map((trip) => {
          const imageUrl = getTripImageUrl(trip.id, trip.imageUrl);
          return (
            <button
              aria-pressed={trip.id === activeTripId}
              className={`destination-card ${trip.id === activeTripId ? "active" : ""}`}
              key={trip.id}
              onClick={() => onTripChange(trip.id)}
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
