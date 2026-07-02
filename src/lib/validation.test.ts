import { describe, expect, it } from "vitest";
import { travelFolders } from "../data/travelData";
import { travelColors } from "./theme";
import { validateTravelFolders } from "./validation";

describe("travel data validation", () => {
  it("accepts the bundled travel folders", () => {
    expect(travelFolders.map((folder) => folder.id)).toContain("weekends-depuis-taiwan");
    expect(travelFolders.find((folder) => folder.id === "weekends-depuis-taiwan")?.trips).toHaveLength(11);
  });

  it("keeps weekend trips visible as multiple map steps", () => {
    const weekendTrips = travelFolders.find((folder) => folder.id === "weekends-depuis-taiwan")?.trips ?? [];

    expect(weekendTrips.every((trip) => trip.steps.length >= 4)).toBe(true);
    expect(weekendTrips.every((trip) => trip.steps.every((step) => step.coordinates.length === 2))).toBe(true);
  });

  it("rejects invalid coordinates", () => {
    expect(() =>
      validateTravelFolders([
        {
          id: "bad-folder",
          label: "Bad folder",
          trips: [
            {
              id: "bad-trip",
              folderId: "bad-folder",
              title: "Bad trip",
              description: "Invalid coordinates",
              startDate: "2026-01-01",
              endDate: "2026-01-02",
              status: "draft",
              stats: [],
              steps: [
                {
                  id: "bad-step",
                  label: "Bad step",
                  shortLabel: "Bad",
                  region: "Nowhere",
                  country: "Nowhere",
                  color: travelColors.route,
                  coordinates: [100, 2],
                  startDate: "2026-01-01",
                  endDate: "2026-01-01",
                  nights: "0",
                  transport: "None",
                  highlights: [],
                  dailyPlan: [],
                },
              ],
              bookings: [],
              documents: [],
            },
          ],
        },
      ]),
    ).toThrow();
  });
});
