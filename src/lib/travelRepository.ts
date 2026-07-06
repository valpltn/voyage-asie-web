import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { expenseItems as localExpenseItems } from "../data/expenses";
import { travelFolders as localTravelFolders } from "../data/travelData";
import type { ExpenseItem, TravelFolder, Trip } from "./types";
import { validateTravelFolders } from "./validation";
import { isSupabaseConfigured, supabase } from "./supabase";

interface FolderRow {
  id: string;
  label: string;
  sort_order: number;
  is_public: boolean;
}

interface TripRow {
  id: string;
  folder_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: Trip["status"];
  stats: Trip["stats"];
  steps: Trip["steps"];
  bookings: Trip["bookings"];
  documents: Trip["documents"];
  notes?: string | null;
  is_public: boolean;
  sort_order: number;
}

interface ExpenseRow {
  id: string;
  trip_id?: string | null;
  label: string;
  category: string;
  kind: ExpenseItem["kind"];
  amount: number;
  currency: "EUR";
  date?: string | null;
  notes?: string | null;
}

export interface TravelDataResult {
  source: "local" | "supabase";
  folders: TravelFolder[];
  expenses: ExpenseItem[];
}

export function sanitizeTripForPublic(trip: Trip): Trip {
  return {
    ...trip,
    bookings: [],
    documents: trip.documents.filter((document) => document.visibility === "public"),
    notes: undefined,
  };
}

function rowToTrip(row: TripRow, includePrivate: boolean): Trip {
  const trip: Trip = {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    stats: row.stats ?? [],
    steps: row.steps ?? [],
    bookings: row.bookings ?? [],
    documents: row.documents ?? [],
    notes: row.notes ?? undefined,
  };

  return includePrivate ? trip : sanitizeTripForPublic(trip);
}

function rowToExpense(row: ExpenseRow): ExpenseItem {
  return {
    id: row.id,
    tripId: row.trip_id ?? undefined,
    label: row.label,
    category: row.category,
    kind: row.kind,
    amount: Number(row.amount),
    currency: row.currency,
    date: row.date ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function tripToRow(trip: Trip, ownerId: string, isPublic = true, sortOrder = 0) {
  return {
    id: trip.id,
    owner_id: ownerId,
    folder_id: trip.folderId,
    title: trip.title,
    description: trip.description,
    start_date: trip.startDate,
    end_date: trip.endDate,
    status: trip.status,
    stats: trip.stats,
    steps: trip.steps,
    bookings: trip.bookings,
    documents: trip.documents,
    notes: trip.notes ?? null,
    is_public: isPublic,
    sort_order: sortOrder,
  };
}

function localData(): TravelDataResult {
  return {
    source: "local",
    folders: localTravelFolders,
    expenses: localExpenseItems,
  };
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthStateChange(callback: (user: User | null, event: AuthChangeEvent) => void) {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(session?.user ?? null, event));
  return () => data.subscription.unsubscribe();
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadTravelData(includePrivate: boolean): Promise<TravelDataResult> {
  if (!isSupabaseConfigured || !supabase) return localData();

  const folderQuery = supabase
    .from("travel_folders")
    .select("id,label,sort_order,is_public")
    .order("sort_order", { ascending: true });

  const tripQuery = supabase
    .from("trips")
    .select("id,folder_id,title,description,start_date,end_date,status,stats,steps,bookings,documents,notes,is_public,sort_order")
    .order("sort_order", { ascending: true });

  const [foldersResult, tripsResult, expensesResult] = await Promise.all([
    includePrivate ? folderQuery : folderQuery.eq("is_public", true),
    includePrivate ? tripQuery : tripQuery.eq("is_public", true),
    includePrivate
      ? supabase.from("expenses").select("id,trip_id,label,category,kind,amount,currency,date,notes")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (foldersResult.error || tripsResult.error || expensesResult.error) {
    throw foldersResult.error ?? tripsResult.error ?? expensesResult.error;
  }

  const tripsByFolder = new Map<string, Trip[]>();
  for (const row of (tripsResult.data ?? []) as TripRow[]) {
    const trip = rowToTrip(row, includePrivate);
    tripsByFolder.set(trip.folderId, [...(tripsByFolder.get(trip.folderId) ?? []), trip]);
  }

  const folders = ((foldersResult.data ?? []) as FolderRow[])
    .map((folder) => ({
      id: folder.id,
      label: folder.label,
      trips: tripsByFolder.get(folder.id) ?? [],
    }))
    .filter((folder) => folder.trips.length > 0 || includePrivate);

  if (folders.length === 0) return localData();

  return {
    source: "supabase",
    folders: validateTravelFolders(folders),
    expenses: ((expensesResult.data ?? []) as ExpenseRow[]).map(rowToExpense),
  };
}

export async function saveTrip(trip: Trip, ownerId: string, isPublic = true) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  validateTravelFolders([{ id: trip.folderId, label: "Validation", trips: [trip] }]);
  const { error } = await supabase.from("trips").upsert(tripToRow(trip, ownerId, isPublic), { onConflict: "id" });
  if (error) throw error;
}

export async function saveFolder(folder: TravelFolder, ownerId: string) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  const { error } = await supabase.from("travel_folders").upsert(
    {
      id: folder.id,
      owner_id: ownerId,
      label: folder.label,
      is_public: true,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function saveExpense(expense: ExpenseItem, ownerId: string) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  const { error } = await supabase.from("expenses").upsert(
    {
      id: expense.id,
      owner_id: ownerId,
      trip_id: expense.tripId ?? null,
      label: expense.label,
      category: expense.category,
      kind: expense.kind,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date ?? null,
      notes: expense.notes ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}
