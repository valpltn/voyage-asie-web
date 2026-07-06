import { describe, expect, it } from "vitest";
import type { Trip } from "./types";
import { getLocalTravelData, mergeExpensesWithLocal, mergeFoldersWithLocal, sanitizeTripForPublic } from "./travelRepository";

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

  it("keeps local trips when Supabase only contains a partial migration", () => {
    const folders = mergeFoldersWithLocal(
      [
        {
          id: "asie-2026",
          label: "Asie 2026",
          trips: [
            {
              ...trip,
              id: "sud-chine-tainan-2026",
              folderId: "asie-2026",
              title: "Voyage Chine modifie",
              bookings: [],
              documents: [],
            },
          ],
        },
      ],
      true,
    );

    const asieFolder = folders.find((folder) => folder.id === "asie-2026");

    expect(asieFolder?.trips.map((item) => item.id)).toContain("taiwan-suite-2026");
    expect(asieFolder?.trips.find((item) => item.id === "sud-chine-tainan-2026")?.title).toBe("Voyage Chine modifie");
  });

  it("merges remote expenses without requiring local seed data", () => {
    const expenses = mergeExpensesWithLocal([
      {
        id: "remote-expense",
        tripId: "sud-chine-tainan-2026",
        label: "Train",
        category: "Transport",
        kind: "actual",
        amount: 42,
        currency: "EUR",
      },
    ]);

    expect(expenses).toHaveLength(1);
    expect(expenses[0].label).toBe("Train");
  });

  it("keeps the local database snapshot available as a non-empty fallback", () => {
    const local = getLocalTravelData(false);
    const merged = mergeFoldersWithLocal([], false);

    expect(local.folders.length).toBeGreaterThan(0);
    expect(merged.length).toBeGreaterThan(0);
    expect(merged.some((folder) => folder.trips.length > 0)).toBe(true);
  });
});
