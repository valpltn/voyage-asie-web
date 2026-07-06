import { describe, expect, it } from "vitest";
import type { Trip } from "./types";
import { sanitizeTripForPublic } from "./travelRepository";

const trip: Trip = {
  id: "test-trip",
  folderId: "test-folder",
  title: "Test",
  description: "Trip",
  startDate: "2026-01-01",
  endDate: "2026-01-02",
  status: "planned",
  stats: [],
  steps: [],
  bookings: [
    {
      id: "private-booking",
      tripId: "test-trip",
      category: "Vols",
      label: "Reference privee",
      priority: "high",
      status: "todo",
    },
  ],
  documents: [
    {
      id: "public-doc",
      title: "Public",
      type: "itinerary",
      path: "/docs/public.md",
      tripId: "test-trip",
      visibility: "public",
    },
    {
      id: "private-doc",
      title: "Private",
      type: "note",
      path: "/docs/private.md",
      tripId: "test-trip",
      visibility: "private",
    },
  ],
  notes: "private notes",
};

describe("public travel data sanitization", () => {
  it("removes private fields before anonymous rendering", () => {
    const sanitized = sanitizeTripForPublic(trip);

    expect(sanitized.bookings).toEqual([]);
    expect(sanitized.notes).toBeUndefined();
    expect(sanitized.documents).toHaveLength(1);
    expect(sanitized.documents[0].id).toBe("public-doc");
  });
});
