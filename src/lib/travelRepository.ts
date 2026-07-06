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
  deleted_at?: string | null;
}

export interface TravelDataResult {
  source: "local" | "supabase";
  folders: TravelFolder[];
  expenses: ExpenseItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  isAdmin: boolean;
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
    deletedAt: row.deleted_at ?? undefined,
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

function localData(includePrivate = true): TravelDataResult {
  return {
    source: "local",
    folders: includePrivate
      ? localTravelFolders
      : localTravelFolders.map((folder) => ({
          ...folder,
          trips: folder.trips.map(sanitizeTripForPublic),
        })),
    expenses: includePrivate ? localExpenseItems : [],
  };
}

export function mergeFoldersWithLocal(remoteFolders: TravelFolder[], includePrivate: boolean) {
  const folders = new Map<string, TravelFolder>();

  for (const localFolder of localTravelFolders) {
    folders.set(localFolder.id, {
      ...localFolder,
      trips: localFolder.trips.map((trip) => (includePrivate ? trip : sanitizeTripForPublic(trip))),
    });
  }

  for (const remoteFolder of remoteFolders) {
    const existingFolder = folders.get(remoteFolder.id);
    if (!existingFolder) {
      folders.set(remoteFolder.id, remoteFolder);
      continue;
    }

    const trips = new Map(existingFolder.trips.map((trip) => [trip.id, trip]));
    for (const remoteTrip of remoteFolder.trips) {
      trips.set(remoteTrip.id, remoteTrip);
    }

    folders.set(remoteFolder.id, {
      ...existingFolder,
      label: remoteFolder.label,
      trips: Array.from(trips.values()),
    });
  }

  return validateTravelFolders(Array.from(folders.values()));
}

export function mergeExpensesWithLocal(remoteExpenses: ExpenseItem[]) {
  const expenses = new Map(localExpenseItems.map((expense) => [expense.id, expense]));
  for (const remoteExpense of remoteExpenses) {
    if (remoteExpense.deletedAt) {
      expenses.delete(remoteExpense.id);
      continue;
    }
    expenses.set(remoteExpense.id, remoteExpense);
  }
  return Array.from(expenses.values());
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("session") && message.includes("missing")) return null;
    throw error;
  }
  return data.user;
}

export async function getCurrentProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("id,email,is_admin").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    isAdmin: Boolean(data.is_admin),
  };
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
  if (!isSupabaseConfigured || !supabase) return localData(includePrivate);

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
      ? supabase.from("expenses").select("id,trip_id,label,category,kind,amount,currency,date,notes,deleted_at")
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

  const remoteExpenses = ((expensesResult.data ?? []) as ExpenseRow[]).map(rowToExpense);

  return {
    source: "supabase",
    folders: mergeFoldersWithLocal(validateTravelFolders(folders), includePrivate),
    expenses: includePrivate ? mergeExpensesWithLocal(remoteExpenses) : [],
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
      deleted_at: null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function deleteExpense(expense: ExpenseItem, ownerId: string) {
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
      deleted_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function saveExpenseList(previousExpenses: ExpenseItem[], nextExpenses: ExpenseItem[], ownerId: string) {
  const nextIds = new Set(nextExpenses.map((expense) => expense.id));
  const removedExpenses = previousExpenses.filter((expense) => !nextIds.has(expense.id));
  await Promise.all([
    ...nextExpenses.map((expense) => saveExpense(expense, ownerId)),
    ...removedExpenses.map((expense) => deleteExpense(expense, ownerId)),
  ]);
}
