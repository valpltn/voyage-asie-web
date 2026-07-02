import type { WheelEvent } from "react";
import type { TravelFolder } from "../lib/types";
import { formatDateRange } from "../lib/format";

interface TripSwitcherProps {
  folders: TravelFolder[];
  activeFolderId: string;
  activeTripId: string;
  onFolderChange: (folderId: string) => void;
  onTripChange: (tripId: string) => void;
}

export function TripSwitcher({
  folders,
  activeFolderId,
  activeTripId,
  onFolderChange,
  onTripChange,
}: TripSwitcherProps) {
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? folders[0];
  const tripImages: Record<string, string> = {
    "sud-chine-tainan-2026":
      "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80",
    "taiwan-suite-2026":
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=80",
    "voyage-a-programmer":
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "weekend-seoul-2026":
      "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=900&q=80",
    "weekend-tokyo-2026":
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80",
    "weekend-hanoi-2026":
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
    "weekend-singapour-2026":
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80",
    "weekend-manille-2026":
      "https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=900&q=80",
    "weekend-hong-kong-2026":
      "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=900&q=80",
    "weekend-shanghai-2026":
      "https://images.unsplash.com/photo-1508804052814-cd3ba865a116?auto=format&fit=crop&w=900&q=80",
    "weekend-jakarta-2026":
      "https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=900&q=80",
    "weekend-kinmen-2026":
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    "weekend-okinawa-2026":
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=80",
    "weekend-osaka-2026":
      "https://images.unsplash.com/photo-1590253230532-a67f6bc61c9e?auto=format&fit=crop&w=900&q=80",
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80";

  function handleCarouselWheel(event: WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  return (
    <section className="destination-picker" aria-label="Selection du voyage">
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
      </div>

      <div className="destination-grid" onWheel={handleCarouselWheel}>
        {activeFolder.trips.map((trip) => (
          <button
            aria-pressed={trip.id === activeTripId}
            className={`destination-card ${trip.id === activeTripId ? "active" : ""}`}
            key={trip.id}
            onClick={() => onTripChange(trip.id)}
            type="button"
          >
            <span
              className="destination-photo"
              style={{ backgroundImage: `url("${tripImages[trip.id] ?? fallbackImage}")` }}
            />
            <span className="destination-content">
              <span className="destination-meta">{formatDateRange(trip.startDate, trip.endDate)}</span>
              <strong>{trip.title}</strong>
              <span>{trip.stats.map((stat) => `${stat.value} ${stat.label}`).join(" · ")}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
