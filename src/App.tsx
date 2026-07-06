import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BookingChecklist } from "./components/BookingChecklist";
import { DataEditPanel } from "./components/DataEditPanel";
import type { EditTarget } from "./components/DataEditPanel";
import { DocumentList } from "./components/DocumentList";
import { EditButton } from "./components/EditButton";
import { EmptyState } from "./components/EmptyState";
import { ExpensesOverview } from "./components/ExpensesOverview";
import { LoginPanel } from "./components/LoginPanel";
import { RouteTimeline } from "./components/RouteTimeline";
import { StepDetail } from "./components/StepDetail";
import { TripMap } from "./components/TripMap";
import { TripStats } from "./components/TripStats";
import { TripSwitcher } from "./components/TripSwitcher";
import { formatDateRange } from "./lib/format";
import {
  getCurrentProfile,
  getCurrentUser,
  loadTravelData,
  onAuthStateChange,
  saveExpenseList,
  saveFolder,
  saveTrip,
  saveTripList,
  signOut,
} from "./lib/travelRepository";
import type { ExpenseItem, TravelFolder, Trip, TripStep } from "./lib/types";
import { LogOut } from "lucide-react";

type TabId = "map" | "route" | "bookings" | "expenses" | "documents";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "map", label: "Carte" },
  { id: "route", label: "Parcours" },
  { id: "bookings", label: "Reservations" },
  { id: "expenses", label: "Depenses" },
  { id: "documents", label: "Documents" },
];

export function App() {
  const [travelFolders, setTravelFolders] = useState<TravelFolder[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [dataSource, setDataSource] = useState<"local" | "supabase">("local");
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState("");
  const activeFolder = useMemo(
    () => travelFolders.find((folder) => folder.id === activeFolderId) ?? travelFolders[0],
    [activeFolderId, travelFolders],
  );
  const [activeTripId, setActiveTripId] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("map");

  const activeTrip = useMemo(() => {
    if (!activeFolder) return undefined;
    return activeFolder.trips.find((trip) => trip.id === activeTripId) ?? activeFolder.trips[0];
  }, [activeFolder, activeTripId]);

  const [selectedStepId, setSelectedStepId] = useState("");

  async function resolveIsAdmin(currentUser: User | null) {
    if (!currentUser) return false;
    try {
      const profile = await getCurrentProfile(currentUser.id);
      return Boolean(profile?.isAdmin);
    } catch {
      return false;
    }
  }

  const refreshTravelData = useCallback(async (includePrivate = false) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await loadTravelData(includePrivate);
      setTravelFolders(result.folders);
      setExpenseItems(result.expenses);
      setDataSource(result.source);
      const nextFolder = result.folders[0];
      const nextTrip = nextFolder?.trips[0];
      setActiveFolderId((current) => result.folders.some((folder) => folder.id === current) ? current : nextFolder?.id ?? "");
      setActiveTripId((current) =>
        result.folders.some((folder) => folder.trips.some((trip) => trip.id === current)) ? current : nextTrip?.id ?? "",
      );
      setSelectedStepId((current) =>
        result.folders.some((folder) => folder.trips.some((trip) => trip.steps.some((step) => step.id === current)))
          ? current
          : nextTrip?.steps[0]?.id ?? "",
      );
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(async (currentUser) => {
        setUser(currentUser);
        setIsAdmin(await resolveIsAdmin(currentUser));
        return refreshTravelData(Boolean(currentUser));
      })
      .catch((caught) => {
        setLoadError(caught instanceof Error ? caught.message : "Initialisation impossible.");
        void refreshTravelData(false);
      });

    return onAuthStateChange((nextUser, event) => {
      if (event === "INITIAL_SESSION") return;
      setUser(nextUser);
      setIsAdmin(false);
      setShowLogin(false);
      void (async () => {
        setIsAdmin(await resolveIsAdmin(nextUser));
        await refreshTravelData(Boolean(nextUser));
      })();
    });
  }, [refreshTravelData]);

  useEffect(() => {
    const nextTrip = activeFolder?.trips.find((trip) => trip.id === activeTripId) ?? activeFolder?.trips[0];
    if (nextTrip && !nextTrip.steps.some((step) => step.id === selectedStepId)) {
      setSelectedStepId(nextTrip.steps[0]?.id ?? "");
    }
  }, [activeFolder, activeTripId, selectedStepId]);

  if (isLoading && travelFolders.length === 0) {
    return <EmptyState title="Chargement" copy="Les voyages sont en cours de chargement." />;
  }

  if (!activeFolder || !activeTrip) {
    return <EmptyState title="Aucun voyage disponible" copy="Ajoute un dossier et un voyage dans src/data/travelData.ts." />;
  }

  const selectedStep: TripStep | undefined =
    activeTrip.steps.find((step) => step.id === selectedStepId) ?? activeTrip.steps[0];

  function handleFolderChange(folderId: string) {
    const nextFolder = travelFolders.find((folder) => folder.id === folderId);
    const nextTrip = nextFolder?.trips[0];
    setActiveFolderId(folderId);
    setActiveTripId(nextTrip?.id ?? "");
    setSelectedStepId(nextTrip?.steps[0]?.id ?? "");
  }

  function handleTripChange(tripId: string) {
    const nextTrip = activeFolder.trips.find((trip) => trip.id === tripId);
    setActiveTripId(tripId);
    setSelectedStepId(nextTrip?.steps[0]?.id ?? "");
  }

  async function handleSaveTrip(nextTrip: Trip) {
    if (!user || !isAdmin) throw new Error("Mode admin requis.");
    const folder = travelFolders.find((item) => item.id === nextTrip.folderId);
    if (!folder) throw new Error("Le dossier du voyage est introuvable.");
    await saveFolder(folder, user.id);
    await saveTrip(nextTrip, user.id, true);
    await refreshTravelData(true);
  }

  async function handleSaveFolderTrips(folderId: string, nextTrips: Trip[]) {
    if (!user || !isAdmin) throw new Error("Mode admin requis.");
    const folder = travelFolders.find((item) => item.id === folderId);
    if (!folder) throw new Error("Le dossier est introuvable.");
    await saveFolder(folder, user.id);
    await saveTripList(folder.trips, nextTrips, user.id);
    await refreshTravelData(true);
  }

  async function handleSaveExpenses(nextExpenses: ExpenseItem[]) {
    if (!user || !isAdmin) throw new Error("Mode admin requis.");
    const tripIds = new Set(nextExpenses.map((expense) => expense.tripId).filter(Boolean));
    const foldersToSave = travelFolders.filter((folder) => folder.trips.some((trip) => tripIds.has(trip.id)));
    for (const folder of foldersToSave) {
      await saveFolder(folder, user.id);
      await Promise.all(folder.trips.filter((trip) => tripIds.has(trip.id)).map((trip) => saveTrip(trip, user.id, true)));
    }
    await saveExpenseList(expenseItems, nextExpenses, user.id);
    await refreshTravelData(true);
  }

  return (
    <main className="shell">
      <div className="top-actions" aria-label="Session">
        <span>{dataSource === "supabase" ? "Donnees Supabase" : "Donnees locales"}</span>
        {loadError && <span className="warning-text">{loadError}</span>}
        {user ? (
          <>
            <span>{user.email}</span>
            <span>{isAdmin ? "Mode admin" : "Lecture connectee"}</span>
            <button className="plain-btn icon-text-btn" onClick={() => void signOut()} type="button">
              <LogOut aria-hidden="true" size={16} />
              Deconnexion
            </button>
          </>
        ) : (
          <button className="plain-btn" onClick={() => setShowLogin((value) => !value)} type="button">
            Connexion
          </button>
        )}
      </div>

      <header className="topbar">
        <div className="editable-region">
          {isAdmin && <EditButton label="Modifier le voyage" onClick={() => setEditTarget({ type: "trip" })} />}
          <p className="eyebrow">{formatDateRange(activeTrip.startDate, activeTrip.endDate)}</p>
          <h1>{activeTrip.title}</h1>
          <p className="subtitle">{activeTrip.description}</p>
        </div>
        <TripStats onEdit={isAdmin ? () => setEditTarget({ type: "stats" }) : undefined} stats={activeTrip.stats} />
      </header>

      {showLogin && <LoginPanel onClose={() => setShowLogin(false)} />}
      {editTarget && isAdmin && (
        <DataEditPanel
          expenses={expenseItems}
          folders={travelFolders}
          onClose={() => setEditTarget(null)}
          onSaveExpenses={handleSaveExpenses}
          onSaveFolderTrips={handleSaveFolderTrips}
          onSaveTrip={handleSaveTrip}
          target={editTarget}
          trip={activeTrip}
        />
      )}

      <TripSwitcher
        folders={travelFolders}
        activeFolderId={activeFolder.id}
        activeTripId={activeTrip.id}
        onFolderChange={handleFolderChange}
        onManageTrips={isAdmin ? () => setEditTarget({ type: "folderTrips", folderId: activeFolder.id }) : undefined}
        onTripChange={handleTripChange}
      />

      <nav className="tabs" aria-label="Vues du voyage">
        {tabs.map((tab) => (
          <button
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "map" && (
        <section className="view active">
          {activeTrip.steps.length === 0 ? (
            <EmptyState title="Aucune etape" copy="Ajoute des etapes validees pour afficher la carte du voyage." />
          ) : (
            <div className="map-layout">
              <TripMap
                selectedStepId={selectedStep?.id}
                steps={activeTrip.steps}
                onStepSelect={setSelectedStepId}
              />
              <aside className="detail-card" aria-live="polite">
                {selectedStep && (
                  <StepDetail
                    onEdit={isAdmin ? () => setEditTarget({ type: "step", stepId: selectedStep.id }) : undefined}
                    step={selectedStep}
                  />
                )}
                <div className="route-list" aria-label="Etapes du parcours">
                  {activeTrip.steps.map((step, index) => (
                    <button
                      className={`route-item ${selectedStep?.id === step.id ? "active" : ""}`}
                      key={step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      type="button"
                    >
                      <span className="route-number" style={{ background: step.color }}>
                        {index + 1}
                      </span>
                      <span className="route-copy">
                        <strong>{step.shortLabel}</strong>
                        <span>
                          {formatDateRange(step.startDate, step.endDate)} - {step.nights}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </section>
      )}

      {activeTab === "route" && (
        <RouteTimeline
          onEditStep={isAdmin ? (stepId) => setEditTarget({ type: "step", stepId }) : undefined}
          steps={activeTrip.steps}
        />
      )}
      {activeTab === "bookings" && (
        <BookingChecklist bookings={activeTrip.bookings} onEdit={isAdmin ? () => setEditTarget({ type: "bookings" }) : undefined} />
      )}
      {activeTab === "expenses" && (
        <ExpensesOverview
          activeTripId={activeTrip.id}
          expenses={expenseItems}
          folders={travelFolders}
          onEdit={isAdmin ? () => setEditTarget({ type: "expenses" }) : undefined}
        />
      )}
      {activeTab === "documents" && (
        <DocumentList documents={activeTrip.documents} onEdit={isAdmin ? () => setEditTarget({ type: "documents" }) : undefined} />
      )}
    </main>
  );
}
