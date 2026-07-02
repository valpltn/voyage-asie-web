import type { TravelFolder } from "../lib/types";

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

  return (
    <>
      <div className="switcher-field">
        <label htmlFor="folder-select">Dossier</label>
        <select id="folder-select" onChange={(event) => onFolderChange(event.target.value)} value={activeFolderId}>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.label}
            </option>
          ))}
        </select>
      </div>
      <div className="switcher-field">
        <label htmlFor="trip-select">Voyage</label>
        <select id="trip-select" onChange={(event) => onTripChange(event.target.value)} value={activeTripId}>
          {activeFolder.trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.title}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
