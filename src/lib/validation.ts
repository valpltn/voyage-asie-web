import { z } from "zod";

const kebabId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const hexColor = /^#[0-9a-fA-F]{6}$/;

const tripStatSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const dailyPlanItemSchema = z.object({
  date: z.string().min(1),
  summary: z.string().min(1),
});

const activitySuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  sourceLabel: z.string().min(1),
  sourceUrl: z.string().url(),
  coordinates: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]).optional(),
});

const tripStepSchema = z.object({
  id: z.string().regex(kebabId),
  label: z.string().min(1),
  shortLabel: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  color: z.string().regex(hexColor),
  coordinates: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
  startDate: z.string().regex(isoDate),
  endDate: z.string().regex(isoDate),
  nights: z.string().min(1),
  transport: z.string().min(1),
  highlights: z.array(z.string().min(1)),
  dailyPlan: z.array(dailyPlanItemSchema),
  activities: z.array(activitySuggestionSchema).optional(),
});

const bookingTaskSchema = z.object({
  id: z.string().regex(kebabId),
  tripId: z.string().regex(kebabId),
  category: z.string().min(1),
  label: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["todo", "booked", "skipped"]),
  dueDate: z.string().regex(isoDate).optional(),
  notes: z.string().optional(),
  externalUrl: z.string().url().optional(),
});

const documentLinkSchema = z.object({
  id: z.string().regex(kebabId),
  title: z.string().min(1),
  type: z.enum(["itinerary", "checklist", "note", "reference"]),
  path: z.string().min(1),
  tripId: z.string().regex(kebabId),
  visibility: z.enum(["public", "private"]),
});

const tripSchema = z.object({
  id: z.string().regex(kebabId),
  folderId: z.string().regex(kebabId),
  title: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().regex(isoDate),
  endDate: z.string().regex(isoDate),
  status: z.enum(["draft", "planned", "active", "archived"]),
  stats: z.array(tripStatSchema),
  steps: z.array(tripStepSchema),
  bookings: z.array(bookingTaskSchema),
  documents: z.array(documentLinkSchema),
  notes: z.string().optional(),
});

export const travelFolderSchema = z.object({
  id: z.string().regex(kebabId),
  label: z.string().min(1),
  trips: z.array(tripSchema),
});

export const travelFoldersSchema = z.array(travelFolderSchema).superRefine((folders, context) => {
  for (const folder of folders) {
    for (const trip of folder.trips) {
      if (trip.folderId !== folder.id) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Trip ${trip.id} declares folderId ${trip.folderId}, expected ${folder.id}.`,
          path: [folder.id, trip.id, "folderId"],
        });
      }

      for (const booking of trip.bookings) {
        if (booking.tripId !== trip.id) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Booking ${booking.id} is attached to ${booking.tripId}, expected ${trip.id}.`,
            path: [folder.id, trip.id, "bookings", booking.id],
          });
        }
      }

      for (const document of trip.documents) {
        if (document.tripId !== trip.id) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Document ${document.id} is attached to ${document.tripId}, expected ${trip.id}.`,
            path: [folder.id, trip.id, "documents", document.id],
          });
        }
      }
    }
  }
});

export function validateTravelFolders(data: unknown) {
  return travelFoldersSchema.parse(data);
}
