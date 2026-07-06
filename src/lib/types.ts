export type TripStatus = "draft" | "planned" | "active" | "archived";
export type BookingPriority = "high" | "medium" | "low";
export type BookingStatus = "todo" | "booked" | "skipped";
export type DocumentType = "itinerary" | "checklist" | "note" | "reference";
export type DocumentVisibility = "public" | "private";

export interface TripStat {
  value: string;
  label: string;
}

export interface DailyPlanItem {
  date: string;
  summary: string;
}

export interface ActivitySuggestion {
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  coordinates?: [number, number];
}

export interface TripStep {
  id: string;
  label: string;
  shortLabel: string;
  region: string;
  country: string;
  color: string;
  coordinates: [number, number];
  startDate: string;
  endDate: string;
  nights: string;
  transport: string;
  highlights: string[];
  dailyPlan: DailyPlanItem[];
  activities?: ActivitySuggestion[];
}

export interface BookingTask {
  id: string;
  tripId: string;
  category: string;
  label: string;
  priority: BookingPriority;
  status: BookingStatus;
  dueDate?: string;
  notes?: string;
  externalUrl?: string;
}

export interface DocumentLink {
  id: string;
  title: string;
  type: DocumentType;
  path: string;
  tripId: string;
  visibility: DocumentVisibility;
}

export interface Trip {
  id: string;
  folderId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  stats: TripStat[];
  steps: TripStep[];
  bookings: BookingTask[];
  documents: DocumentLink[];
  notes?: string;
}

export interface TravelFolder {
  id: string;
  label: string;
  trips: Trip[];
}

export type ExpenseKind = "planned" | "actual";

export interface ExpenseItem {
  id: string;
  tripId?: string;
  label: string;
  category: string;
  kind: ExpenseKind;
  amount: number;
  currency: "EUR";
  date?: string;
  notes?: string;
  deletedAt?: string;
}
