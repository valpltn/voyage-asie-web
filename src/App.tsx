import { useMemo, useState } from "react";
import { BookingChecklist } from "./components/BookingChecklist";
import { DocumentList } from "./components/DocumentList";
import { EmptyState } from "./components/EmptyState";
import { ExpensesOverview } from "./components/ExpensesOverview";
import { RouteTimeline } from "./components/RouteTimeline";
import { StepDetail } from "./components/StepDetail";
import { TripMap } from "./components/TripMap";
import { TripStats } from "./components/TripStats";
import { TripSwitcher } from "./components/TripSwitcher";
import { travelFolders } from "./data/travelData";
import { expenseItems } from "./data/expenses";
import { formatDateRange } from "./lib/format";
import type { TripStep } from "./lib/types";

type TabId = "map" | "route" | "bookings" | "expenses" | "documents";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "map", label: "Carte" },
  { id: "route", label: "Parcours" },
  { id: "bookings", label: "Reservations" },
  { id: "expenses", label: "Depenses" },
  { id: "documents", label: "Documents" },
];

export function App() {
  const [activeFolderId, setActiveFolderId] = useState(travelFolders[0]?.id ?? "");
  const activeFolder = useMemo(
    () => travelFolders.find((folder) => folder.id === activeFolderId) ?? travelFolders[0],
    [activeFolderId],
  );
  const [activeTripId, setActiveTripId] = useState(activeFolder?.trips[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<TabId>("map");

  const activeTrip = useMemo(() => {
    if (!activeFolder) return undefined;
    return activeFolder.trips.find((trip) => trip.id === activeTripId) ?? activeFolder.trips[0];
  }, [activeFolder, activeTripId]);

  const [selectedStepId, setSelectedStepId] = useState(activeTrip?.steps[0]?.id ?? "");

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

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{formatDateRange(activeTrip.startDate, activeTrip.endDate)}</p>
          <h1>{activeTrip.title}</h1>
          <p className="subtitle">{activeTrip.description}</p>
        </div>
        <div className="trip-switcher" aria-label="Selection du voyage">
          <TripSwitcher
            folders={travelFolders}
            activeFolderId={activeFolder.id}
            activeTripId={activeTrip.id}
            onFolderChange={handleFolderChange}
            onTripChange={handleTripChange}
          />
          <TripStats stats={activeTrip.stats} />
        </div>
      </header>

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
                {selectedStep && <StepDetail step={selectedStep} />}
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

      {activeTab === "route" && <RouteTimeline steps={activeTrip.steps} />}
      {activeTab === "bookings" && <BookingChecklist bookings={activeTrip.bookings} />}
      {activeTab === "expenses" && <ExpensesOverview expenses={expenseItems} folders={travelFolders} />}
      {activeTab === "documents" && <DocumentList documents={activeTrip.documents} />}
    </main>
  );
}
