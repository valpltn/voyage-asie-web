import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { localDatabase } from "../data/localDatabase";
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
  image_url?: string | null;
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
    imageUrl: row.image_url ?? undefined,
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
    image_url: trip.imageUrl ?? null,
    notes: trip.notes ?? null,
    is_public: isPublic,
    sort_order: sortOrder,
  };
}

function localData(includePrivate = true): TravelDataResult {
  return {
    source: "local",
    folders: includePrivate
      ? localDatabase.folders
      : localDatabase.folders.map((folder) => ({
          ...folder,
          trips: folder.trips.map(sanitizeTripForPublic),
        })),
    expenses: localDatabase.expenses,
  };
}

export function mergeFoldersWithLocal(remoteFolders: TravelFolder[], includePrivate: boolean) {
  const folders = new Map<string, TravelFolder>();

  for (const localFolder of localDatabase.folders) {
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

  const mergedFolders = Array.from(folders.values()).filter((folder) => folder.trips.length > 0 || includePrivate);
  return mergedFolders.length > 0 ? validateTravelFolders(mergedFolders) : localData(includePrivate).folders;
}

export function mergeExpensesWithLocal(remoteExpenses: ExpenseItem[]) {
  const expenses = new Map(localDatabase.expenses.map((expense) => [expense.id, expense]));
  for (const remoteExpense of remoteExpenses) {
    expenses.set(remoteExpense.id, remoteExpense);
  }
  return Array.from(expenses.values());
}

function isTripReferenceError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  const message = candidate.message?.toLowerCase() ?? "";
  return candidate.code === "23503" || (message.includes("trip_id") && message.includes("foreign key"));
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  const message = candidate.message?.toLowerCase() ?? "";
  return candidate.code === "PGRST204" || (message.includes(columnName) && message.includes("schema"));
}

async function loadTripRows(includePrivate: boolean) {
  if (!supabase) return [];
  const query = supabase
    .from("trips")
    .select("id,folder_id,title,description,start_date,end_date,status,stats,steps,bookings,documents,image_url,notes,is_public,sort_order")
    .order("sort_order", { ascending: true });
  const result = await (includePrivate ? query : query.eq("is_public", true));
  if (!result.error) return result.data ?? [];
  if (!isMissingColumnError(result.error, "image_url")) throw result.error;

  const fallbackQuery = supabase
    .from("trips")
    .select("id,folder_id,title,description,start_date,end_date,status,stats,steps,bookings,documents,notes,is_public,sort_order")
    .order("sort_order", { ascending: true });
  const fallbackResult = await (includePrivate ? fallbackQuery : fallbackQuery.eq("is_public", true));
  if (fallbackResult.error) throw fallbackResult.error;
  return fallbackResult.data ?? [];
}

async function loadExpenseRows() {
  if (!supabase) return [];
  const result = await supabase
    .from("expenses")
    .select("id,trip_id,label,category,kind,amount,currency,date,notes");
  if (result.error) throw result.error;
  return result.data ?? [];
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

  const [remoteFolders, expenseRows] = await Promise.all([
    loadRemoteFolders(includePrivate),
    loadExpenseRows().catch(() => []),
  ]);
  const remoteExpenses = (expenseRows as ExpenseRow[]).map(rowToExpense);

  return {
    source: "supabase",
    folders: ensureFolders(mergeFoldersWithLocal(remoteFolders, includePrivate), includePrivate),
    expenses: mergeExpensesWithLocal(remoteExpenses),
  };
}

export function getLocalTravelData(includePrivate = true): TravelDataResult {
  return localData(includePrivate);
}

function ensureFolders(folders: TravelFolder[], includePrivate: boolean) {
  return folders.length > 0 ? folders : localData(includePrivate).folders;
}

async function loadRemoteFolders(includePrivate: boolean) {
  if (!supabase) return [];
  const folderQuery = supabase
    .from("travel_folders")
    .select("id,label,sort_order,is_public")
    .order("sort_order", { ascending: true });

  const [foldersResult, tripsResult] = await Promise.all([
    includePrivate ? folderQuery : folderQuery.eq("is_public", true),
    loadTripRows(includePrivate).then((data) => ({ data, error: null })),
  ]);

  if (foldersResult.error || tripsResult.error) return [];

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

  return validateTravelFolders(folders);
}

export async function saveTrip(trip: Trip, ownerId: string, isPublic = true) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  validateTravelFolders([{ id: trip.folderId, label: "Validation", trips: [trip] }]);
  const { error } = await supabase.from("trips").upsert(tripToRow(trip, ownerId, isPublic), { onConflict: "id" });
  if (!error) return;
  if (!isMissingColumnError(error, "image_url")) throw error;
  const { image_url: _imageUrl, ...fallbackRow } = tripToRow(trip, ownerId, isPublic);
  const fallbackResult = await supabase.from("trips").upsert(fallbackRow, { onConflict: "id" });
  if (fallbackResult.error) throw fallbackResult.error;
}

export async function deleteTrip(trip: Trip, _ownerId: string) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  const { error } = await supabase.from("trips").delete().eq("id", trip.id);
  if (error) throw error;
}

export async function saveTripList(previousTrips: Trip[], nextTrips: Trip[], ownerId: string) {
  const nextIds = new Set(nextTrips.map((trip) => trip.id));
  const removedTrips = previousTrips.filter((trip) => !nextIds.has(trip.id));
  await Promise.all([
    ...nextTrips.map((trip, index) => saveTrip(trip, ownerId, true).then(async () => {
      if (!supabase) return;
      await supabase.from("trips").update({ sort_order: index }).eq("id", trip.id);
    })),
    ...removedTrips.map((trip) => deleteTrip(trip, ownerId)),
  ]);
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
  const row = expenseToRow(expense, ownerId);
  const error = await upsertExpenseRow(row);
  if (!error) return;
  if (!isTripReferenceError(error) || !expense.tripId) throw error;

  const fallbackError = await upsertExpenseRow({ ...row, trip_id: null });
  if (fallbackError) throw fallbackError;
}

function expenseToRow(expense: ExpenseItem, ownerId: string) {
  return {
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
  };
}

async function upsertExpenseRow(row: ReturnType<typeof expenseToRow>) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  const { error } = await supabase.from("expenses").upsert(row, { onConflict: "id" });
  return error ?? null;
}

export async function deleteExpense(expense: ExpenseItem, _ownerId: string) {
  if (!supabase) throw new Error("Supabase n'est pas configure.");
  const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
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
