import type { TravelFolder } from "../lib/types";

export interface TripSwitcherProps {
  folders: TravelFolder[];
  activeFolderId: string;
  activeTripId: string;
  onFolderChange: (folderId: string) => void;
  onManageTrips?: () => void;
  onTripChange: (tripId: string) => void;
}

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

export function getTripImageUrl(tripId: string, imageUrl?: string) {
  return imageUrl ?? tripImages[tripId] ?? fallbackImage;
}
