import { FormEvent, useEffect, useState } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { geocodeAddress, roundCoordinate } from "../lib/geocoding";
import type { BookingTask, DocumentLink, ExpenseItem, TravelFolder, Trip, TripStat, TripStep } from "../lib/types";

export type EditTarget =
  | { type: "trip" }
  | { type: "folderTrips"; folderId: string }
  | { type: "stats" }
  | { type: "step"; stepId: string }
  | { type: "steps" }
  | { type: "bookings" }
  | { type: "documents" }
  | { type: "expenses" };

interface DataEditPanelProps {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
  onClose: () => void;
  onSaveExpenses: (expenses: ExpenseItem[]) => Promise<void>;
  onSaveFolderTrips: (folder: TravelFolder) => Promise<void>;
  onSaveTrip: (trip: Trip) => Promise<void>;
  target: EditTarget;
  trip: Trip;
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value: string[]) {
  return value.join("\n");
}

function dailyPlanToLines(value: TripStep["dailyPlan"]) {
  return value.map((item) => `${item.date} | ${item.summary}`).join("\n");
}

function linesToDailyPlan(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [date, ...summaryParts] = item.split("|");
      return {
        date: date.trim() || "Jour",
        summary: summaryParts.join("|").trim() || item,
      };
    });
}

function parseJsonArray<T>(value: string, label: string): T[] {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error(`${label} doit être un tableau JSON.`);
  return parsed as T[];
}

const expenseCategories = ["Transport", "Hébergement", "Repas", "Activités", "Documents", "Divers"];

export function DataEditPanel({ expenses, folders, onClose, onSaveExpenses, onSaveFolderTrips, onSaveTrip, target, trip }: DataEditPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <aside className="edit-panel" aria-label="Édition des données">
      <div className="edit-panel-header">
        <div>
          <p className="eyebrow">Édition</p>
          <h2>{titleFor(target)}</h2>
        </div>
        <button aria-label="Fermer le panneau" className="icon-btn" onClick={onClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      {target.type === "trip" && (
        <TripForm
          isSaving={isSaving}
          onSubmit={(nextTrip) => save(setIsSaving, setError, setMessage, () => onSaveTrip(nextTrip))}
          trip={trip}
        />
      )}
      {target.type === "folderTrips" && (
        <FolderTripsForm
          folder={folders.find((folder) => folder.id === target.folderId) ?? folders[0]}
          isSaving={isSaving}
          onSubmit={(folder) =>
            save(setIsSaving, setError, setMessage, () => onSaveFolderTrips(folder))
          }
        />
      )}
      {target.type === "stats" && (
        <StatsForm
          isSaving={isSaving}
          onSubmit={(stats) => save(setIsSaving, setError, setMessage, () => onSaveTrip({ ...trip, stats }))}
          stats={trip.stats}
        />
      )}
      {target.type === "step" && (
        <StepForm
          isSaving={isSaving}
          onSubmit={(step) =>
            save(setIsSaving, setError, setMessage, () =>
              onSaveTrip({ ...trip, steps: trip.steps.map((item) => (item.id === step.id ? step : item)) }),
            )
          }
          step={trip.steps.find((step) => step.id === target.stepId) ?? trip.steps[0]}
        />
      )}
      {target.type === "steps" && (
        <StepsForm
          isSaving={isSaving}
          onSubmit={(steps) => save(setIsSaving, setError, setMessage, () => onSaveTrip({ ...trip, steps }))}
          trip={trip}
        />
      )}
      {target.type === "bookings" && (
        <BookingsForm
          bookings={trip.bookings}
          isSaving={isSaving}
          onSubmit={(bookings) => save(setIsSaving, setError, setMessage, () => onSaveTrip({ ...trip, bookings }))}
          tripId={trip.id}
        />
      )}
      {target.type === "documents" && (
        <JsonArrayForm<DocumentLink>
          copy="Modifie les documents lies au voyage. Garde visibility=public uniquement pour les documents affichables."
          initialValue={trip.documents}
          isSaving={isSaving}
          label="Documents"
          onSubmit={(documents) => save(setIsSaving, setError, setMessage, () => onSaveTrip({ ...trip, documents }))}
        />
      )}
      {target.type === "expenses" && (
        <ExpensesForm
          expenses={expenses}
          folders={folders}
          isSaving={isSaving}
          onSubmit={(nextExpenses) => save(setIsSaving, setError, setMessage, () => onSaveExpenses(nextExpenses))}
          tripId={trip.id}
        />
      )}

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </aside>
  );
}

function titleFor(target: EditTarget) {
  if (target.type === "trip") return "Voyage";
  if (target.type === "folderTrips") return "Voyages disponibles";
  if (target.type === "stats") return "Statistiques";
  if (target.type === "step") return "Étape";
  if (target.type === "steps") return "Étapes du parcours";
  if (target.type === "bookings") return "Réservations";
  if (target.type === "documents") return "Documents";
  return "Dépenses";
}

async function save(
  setIsSaving: (value: boolean) => void,
  setError: (value: string | null) => void,
  setMessage: (value: string | null) => void,
  action: () => Promise<void>,
) {
  setIsSaving(true);
  setError(null);
  setMessage(null);
  try {
    await action();
    setMessage("Modifications sauvegardées.");
  } catch (caught) {
    setError(caught instanceof Error ? caught.message : "Sauvegarde impossible.");
  } finally {
    setIsSaving(false);
  }
}

function TripForm({ isSaving, onSubmit, trip }: { isSaving: boolean; onSubmit: (trip: Trip) => void; trip: Trip }) {
  const [title, setTitle] = useState(trip.title);
  const [description, setDescription] = useState(trip.description);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [status, setStatus] = useState<Trip["status"]>(trip.status);
  const [imageUrl, setImageUrl] = useState(trip.imageUrl ?? "");
  const [notes, setNotes] = useState(trip.notes ?? "");
  const [steps, setSteps] = useState(trip.steps);
  const [cityQuery, setCityQuery] = useState(trip.steps[0]?.label ?? trip.title);
  const [geocodingMessage, setGeocodingMessage] = useState<string | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setTitle(trip.title);
    setDescription(trip.description);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setStatus(trip.status);
    setImageUrl(trip.imageUrl ?? "");
    setNotes(trip.notes ?? "");
    setSteps(trip.steps);
    setCityQuery(trip.steps[0]?.label ?? trip.title);
    setGeocodingMessage(null);
    setGeocodingError(null);
  }, [trip]);

  async function handleCityGeocoding() {
    setIsGeocoding(true);
    setGeocodingMessage(null);
    setGeocodingError(null);
    try {
      const result = await geocodeAddress(cityQuery);
      const cityLabel = result.city ?? cityQuery.trim();
      const nextStep = {
        ...(steps[0] ?? createDefaultStep(trip.id, startDate, endDate)),
        country: result.country ?? steps[0]?.country ?? "À définir",
        coordinates: result.coordinates,
        label: cityLabel,
        shortLabel: cityLabel,
        startDate,
        endDate,
      };
      setSteps([nextStep, ...steps.slice(1)]);
      if (!title.trim() || title === "Nouveau weekend") {
        setTitle(cityLabel);
      }
      setGeocodingMessage(`Ville trouvée : ${result.address}.`);
    } catch (caught) {
      setGeocodingError(caught instanceof Error ? caught.message : "Recherche impossible.");
    } finally {
      setIsGeocoding(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...trip,
      title,
      description,
      startDate,
      endDate,
      status,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes || undefined,
      steps: steps.map((step, index) => ({
        ...step,
        endDate: index === 0 ? endDate : step.endDate,
        startDate: index === 0 ? startDate : step.startDate,
      })),
    });
  }

  return (
    <form className="editor-form" onSubmit={handleSubmit}>
      <label>Titre<input onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
      <label>Description<textarea onChange={(event) => setDescription(event.target.value)} required value={description} /></label>
      <label>Image du voyage<input onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." type="url" value={imageUrl} /></label>
      <div className="geocoding-box">
        <label>
          Ville principale
          <span className="geocoding-search-row">
            <input
              onChange={(event) => setCityQuery(event.target.value)}
              placeholder="Ex. Osaka, Japon"
              value={cityQuery}
            />
            <button className="plain-btn icon-text-btn" disabled={isGeocoding || !cityQuery.trim()} onClick={handleCityGeocoding} type="button">
              <Search aria-hidden="true" size={16} />
              {isGeocoding ? "Recherche..." : "Rechercher"}
            </button>
          </span>
        </label>
        {steps[0] && (
          <p className="editor-copy">
            Coordonnées : {steps[0].coordinates[0]}, {steps[0].coordinates[1]}
          </p>
        )}
        {geocodingMessage && <p className="inline-success">{geocodingMessage}</p>}
        {geocodingError && <p className="inline-error">{geocodingError}</p>}
      </div>
      <div className="form-row">
        <label>Début<input onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} /></label>
        <label>Fin<input onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} /></label>
      </div>
      <label>
        Statut
        <select onChange={(event) => setStatus(event.target.value as Trip["status"])} value={status}>
          <option value="draft">Brouillon</option>
          <option value="planned">Planifié</option>
          <option value="active">Actif</option>
          <option value="archived">Archivé</option>
        </select>
      </label>
      <label>Notes privées<textarea onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
  );
}

function createDefaultStep(tripId: string, startDate: string, endDate: string): TripStep {
  return {
    id: `${tripId}-centre`,
    label: "Centre ville",
    shortLabel: "Centre",
    region: "À définir",
    country: "À définir",
    color: "#2f8f67",
    coordinates: [25.033, 121.5654],
    startDate,
    endDate,
    nights: "À définir",
    transport: "Transport à préciser.",
    highlights: ["Budget", "Logement", "Activités"],
    dailyPlan: [{ date: "Jour 1", summary: "Arrivée et première balade." }],
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createBlankTrip(folderId: string): Trip {
  const id = createId("voyage");
  return {
    id,
    folderId,
    title: "Nouveau weekend",
    description: "Ajoute une description courte du voyage.",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "draft",
    stats: [
      { value: "3", label: "jours" },
      { value: "2", label: "nuits" },
      { value: "0 EUR", label: "budget indicatif" },
    ],
    steps: [
      {
        ...createDefaultStep(
          id,
          new Date().toISOString().slice(0, 10),
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        ),
        nights: "2 nuits",
      },
    ],
    bookings: [],
    documents: [],
  };
}

function normalizeTripForSave(trip: Trip, folderId: string): Trip {
  const cleanTitle = trip.title.trim() || "Nouveau weekend";
  const nextId = trip.id.trim() || `weekend-${slugify(cleanTitle)}-${Date.now().toString(36)}`;
  return {
    ...trip,
    id: nextId,
    folderId,
    title: cleanTitle,
    description: trip.description.trim() || "Description à compléter.",
    imageUrl: trip.imageUrl?.trim() || undefined,
    notes: trip.notes?.trim() || undefined,
    stats: trip.stats.filter((stat) => stat.value.trim() && stat.label.trim()),
    steps: trip.steps.map((step) => ({
      ...step,
      startDate: step.startDate || trip.startDate,
      endDate: step.endDate || trip.endDate,
    })),
    bookings: trip.bookings.map((booking) => ({ ...booking, tripId: nextId })),
    documents: trip.documents.map((document) => ({ ...document, tripId: nextId })),
  };
}

function FolderTripsForm({
  folder,
  isSaving,
  onSubmit,
}: {
  folder: TravelFolder;
  isSaving: boolean;
  onSubmit: (folder: TravelFolder) => void;
}) {
  const [folderLabel, setFolderLabel] = useState(folder.label);
  const [draftTrips, setDraftTrips] = useState<Trip[]>(folder.trips);
  const [editingId, setEditingId] = useState(folder.trips[0]?.id ?? "");

  useEffect(() => {
    setFolderLabel(folder.label);
    setDraftTrips(folder.trips);
    setEditingId((current) => (folder.trips.some((trip) => trip.id === current) ? current : folder.trips[0]?.id ?? ""));
  }, [folder]);

  const editingTrip = draftTrips.find((draftTrip) => draftTrip.id === editingId) ?? draftTrips[0];

  function addTrip() {
    const nextTrip = createBlankTrip(folder.id);
    setDraftTrips([nextTrip, ...draftTrips]);
    setEditingId(nextTrip.id);
  }

  function duplicateTrip() {
    if (!editingTrip) return;
    const nextTripId = createId(slugify(editingTrip.title) || "voyage");
    const nextTrip: Trip = {
      ...editingTrip,
      id: nextTripId,
      title: `${editingTrip.title} copie`,
      bookings: editingTrip.bookings.map((booking) => ({ ...booking, id: createId("reservation"), tripId: nextTripId })),
      documents: editingTrip.documents.map((document) => ({ ...document, id: createId("document"), tripId: nextTripId })),
    };
    setDraftTrips([nextTrip, ...draftTrips]);
    setEditingId(nextTrip.id);
  }

  function removeTrip(tripId: string) {
    const tripToRemove = draftTrips.find((item) => item.id === tripId);
    if (!tripToRemove) return;
    const confirmed = window.confirm(`Supprimer "${tripToRemove.title}" ?`);
    if (!confirmed) return;
    const nextTrips = draftTrips.filter((item) => item.id !== tripId);
    setDraftTrips(nextTrips);
    if (editingId === tripId) setEditingId(nextTrips[0]?.id ?? "");
  }

  function updateTrip(nextTrip: Trip) {
    const normalizedTrip = normalizeTripForSave(nextTrip, folder.id);
    setDraftTrips(draftTrips.map((item) => (item.id === editingId ? normalizedTrip : item)));
    setEditingId(normalizedTrip.id);
  }

  return (
    <div className="editor-form">
      <label>
        Nom du dossier
        <input onChange={(event) => setFolderLabel(event.target.value)} required value={folderLabel} />
      </label>
      <div className="trip-manager-toolbar">
        <button className="plain-btn icon-text-btn" onClick={addTrip} type="button">
          <Plus aria-hidden="true" size={16} />
          Ajouter un voyage
        </button>
        <button className="plain-btn icon-text-btn" disabled={!editingTrip} onClick={duplicateTrip} type="button">
          <Pencil aria-hidden="true" size={16} />
          Dupliquer
        </button>
      </div>
      <div className="trip-manager-layout">
        <div className="editor-list trip-manager-list" aria-label="Voyages du dossier">
          {draftTrips.length === 0 && <p className="editor-copy">Aucun voyage dans ce dossier.</p>}
          {draftTrips.map((draftTrip) => (
            <article className={`trip-manager-item ${draftTrip.id === editingId ? "active" : ""}`} key={draftTrip.id}>
              <button className="trip-manager-select" onClick={() => setEditingId(draftTrip.id)} type="button">
                <span>
                  <strong>{draftTrip.title}</strong>
                  <small>{draftTrip.startDate} - {draftTrip.endDate}</small>
                </span>
              </button>
              <button
                aria-label="Supprimer le voyage"
                className="icon-btn danger-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  removeTrip(draftTrip.id);
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </article>
          ))}
        </div>
        {editingTrip ? (
          <TripForm isSaving={isSaving} onSubmit={updateTrip} trip={editingTrip} />
        ) : (
          <p className="editor-copy">Ajoute un voyage pour commencer.</p>
        )}
      </div>
      <button
        className="primary-btn"
        disabled={isSaving}
        onClick={() =>
          onSubmit({
            ...folder,
            label: folderLabel.trim() || folder.label,
            trips: draftTrips.map((draftTrip) => normalizeTripForSave(draftTrip, folder.id)),
          })
        }
        type="button"
      >
        Sauvegarder le dossier
      </button>
    </div>
  );
}

function StatsForm({
  isSaving,
  onSubmit,
  stats,
}: {
  isSaving: boolean;
  onSubmit: (stats: TripStat[]) => void;
  stats: TripStat[];
}) {
  const [draft, setDraft] = useState(stats.length > 0 ? stats : [{ value: "", label: "" }]);

  useEffect(() => setDraft(stats.length > 0 ? stats : [{ value: "", label: "" }]), [stats]);

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft.filter((stat) => stat.value.trim() && stat.label.trim()));
      }}
    >
      {draft.map((stat, index) => (
        <div className="form-row" key={index}>
          <label>Valeur<input onChange={(event) => setDraft(draft.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} value={stat.value} /></label>
          <label>Libellé<input onChange={(event) => setDraft(draft.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} value={stat.label} /></label>
        </div>
      ))}
      <button className="plain-btn" onClick={() => setDraft([...draft, { value: "", label: "" }])} type="button">Ajouter une statistique</button>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
  );
}

function StepForm({ isSaving, onSubmit, step }: { isSaving: boolean; onSubmit: (step: TripStep) => void; step: TripStep }) {
  const [draft, setDraft] = useState(step);
  const [highlights, setHighlights] = useState(arrayToLines(step.highlights));
  const [dailyPlan, setDailyPlan] = useState(dailyPlanToLines(step.dailyPlan));
  const [addressQuery, setAddressQuery] = useState(step.label);
  const [geocodingMessage, setGeocodingMessage] = useState<string | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setDraft(step);
    setHighlights(arrayToLines(step.highlights));
    setDailyPlan(dailyPlanToLines(step.dailyPlan));
    setAddressQuery(step.label);
    setGeocodingMessage(null);
    setGeocodingError(null);
  }, [step]);

  async function handleGeocoding() {
    setIsGeocoding(true);
    setGeocodingMessage(null);
    setGeocodingError(null);
    try {
      const result = await geocodeAddress(addressQuery);
      setDraft((current) => ({ ...current, coordinates: result.coordinates }));
      setGeocodingMessage(`Coordonnées trouvées pour ${result.address}.`);
    } catch (caught) {
      setGeocodingError(caught instanceof Error ? caught.message : "Recherche impossible.");
    } finally {
      setIsGeocoding(false);
    }
  }

  function updateCoordinate(index: 0 | 1, value: string) {
    const nextCoordinates: [number, number] = [...draft.coordinates];
    nextCoordinates[index] = roundCoordinate(Number(value));
    setDraft({ ...draft, coordinates: nextCoordinates });
  }

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...draft, dailyPlan: linesToDailyPlan(dailyPlan), highlights: linesToArray(highlights) });
      }}
    >
      <label>Nom<input onChange={(event) => setDraft({ ...draft, label: event.target.value })} required value={draft.label} /></label>
      <label>Nom court<input onChange={(event) => setDraft({ ...draft, shortLabel: event.target.value })} required value={draft.shortLabel} /></label>
      <div className="form-row">
        <label>Pays<input onChange={(event) => setDraft({ ...draft, country: event.target.value })} required value={draft.country} /></label>
        <label>Region<input onChange={(event) => setDraft({ ...draft, region: event.target.value })} required value={draft.region} /></label>
      </div>
      <div className="geocoding-box">
        <label>
          Adresse ou lieu
          <span className="geocoding-search-row">
            <input
              onChange={(event) => setAddressQuery(event.target.value)}
              placeholder="Ex. Tokyo Station, Japan"
              value={addressQuery}
            />
            <button className="plain-btn icon-text-btn" disabled={isGeocoding || !addressQuery.trim()} onClick={handleGeocoding} type="button">
              <Search aria-hidden="true" size={16} />
              {isGeocoding ? "Recherche..." : "Rechercher"}
            </button>
          </span>
        </label>
        {geocodingMessage && <p className="inline-success">{geocodingMessage}</p>}
        {geocodingError && <p className="inline-error">{geocodingError}</p>}
      </div>
      <div className="form-row">
        <label>
          Latitude
          <input
            max="90"
            min="-90"
            onChange={(event) => updateCoordinate(0, event.target.value)}
            required
            step="0.0001"
            type="number"
            value={draft.coordinates[0]}
          />
        </label>
        <label>
          Longitude
          <input
            max="180"
            min="-180"
            onChange={(event) => updateCoordinate(1, event.target.value)}
            required
            step="0.0001"
            type="number"
            value={draft.coordinates[1]}
          />
        </label>
      </div>
      <div className="form-row">
        <label>Début<input onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} required type="date" value={draft.startDate} /></label>
        <label>Fin<input onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} required type="date" value={draft.endDate} /></label>
      </div>
      <label>Nuits<input onChange={(event) => setDraft({ ...draft, nights: event.target.value })} required value={draft.nights} /></label>
      <label>Transport<textarea onChange={(event) => setDraft({ ...draft, transport: event.target.value })} required value={draft.transport} /></label>
      <label>Temps forts<textarea onChange={(event) => setHighlights(event.target.value)} value={highlights} /></label>
      <label>Planning jour par jour<textarea onChange={(event) => setDailyPlan(event.target.value)} placeholder="Jour 1 | Arrivée et installation" value={dailyPlan} /></label>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
  );
}

function createBlankStep(trip: Trip, index: number): TripStep {
  const id = createId("etape");
  return {
    ...createDefaultStep(id, trip.startDate, trip.endDate),
    id,
    label: `Nouvelle étape ${index + 1}`,
    shortLabel: `Étape ${index + 1}`,
  };
}

function normalizeStepForSave(step: TripStep): TripStep {
  const cleanLabel = step.label.trim() || "Nouvelle étape";
  return {
    ...step,
    id: step.id.trim() || createId("etape"),
    label: cleanLabel,
    shortLabel: step.shortLabel.trim() || cleanLabel,
    region: step.region.trim() || "À définir",
    country: step.country.trim() || "À définir",
    nights: step.nights.trim() || "À définir",
    transport: step.transport.trim() || "Transport à préciser.",
    highlights: step.highlights.map((highlight) => highlight.trim()).filter(Boolean),
    dailyPlan: step.dailyPlan.length > 0 ? step.dailyPlan : [{ date: "Jour 1", summary: "Planning à compléter." }],
  };
}

function StepsForm({
  isSaving,
  onSubmit,
  trip,
}: {
  isSaving: boolean;
  onSubmit: (steps: TripStep[]) => void;
  trip: Trip;
}) {
  const [draftSteps, setDraftSteps] = useState<TripStep[]>(trip.steps);
  const [editingId, setEditingId] = useState(trip.steps[0]?.id ?? "");

  useEffect(() => {
    setDraftSteps(trip.steps);
    setEditingId((current) => (trip.steps.some((step) => step.id === current) ? current : trip.steps[0]?.id ?? ""));
  }, [trip]);

  const editingStep = draftSteps.find((step) => step.id === editingId) ?? draftSteps[0];

  function addStep() {
    const nextStep = createBlankStep(trip, draftSteps.length);
    setDraftSteps([...draftSteps, nextStep]);
    setEditingId(nextStep.id);
  }

  function removeStep(stepId: string) {
    const stepToRemove = draftSteps.find((step) => step.id === stepId);
    if (!stepToRemove) return;
    const confirmed = window.confirm(`Supprimer "${stepToRemove.label}" ?`);
    if (!confirmed) return;
    const nextSteps = draftSteps.filter((step) => step.id !== stepId);
    setDraftSteps(nextSteps);
    if (editingId === stepId) setEditingId(nextSteps[0]?.id ?? "");
  }

  function updateStep(nextStep: TripStep) {
    const normalizedStep = normalizeStepForSave(nextStep);
    setDraftSteps(draftSteps.map((step) => (step.id === editingId ? normalizedStep : step)));
    setEditingId(normalizedStep.id);
  }

  return (
    <div className="editor-form">
      <button className="plain-btn icon-text-btn" onClick={addStep} type="button">
        <Plus aria-hidden="true" size={16} />
        Ajouter une étape
      </button>
      <div className="trip-manager-layout">
        <div className="editor-list steps-manager-list" aria-label="Étapes du parcours">
          {draftSteps.length === 0 && <p className="editor-copy">Aucune étape dans ce parcours.</p>}
          {draftSteps.map((step, index) => (
            <article className={`trip-manager-item ${step.id === editingId ? "active" : ""}`} key={step.id}>
              <button className="trip-manager-select" onClick={() => setEditingId(step.id)} type="button">
                <span>
                  <strong>{index + 1}. {step.label}</strong>
                  <small>{step.startDate} - {step.endDate}</small>
                </span>
              </button>
              <button
                aria-label="Supprimer l'étape"
                className="icon-btn danger-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  removeStep(step.id);
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </article>
          ))}
        </div>
        {editingStep ? (
          <StepForm isSaving={isSaving} onSubmit={updateStep} step={editingStep} />
        ) : (
          <p className="editor-copy">Ajoute une étape pour commencer.</p>
        )}
      </div>
      <button
        className="primary-btn"
        disabled={isSaving}
        onClick={() => onSubmit(draftSteps.map(normalizeStepForSave))}
        type="button"
      >
        Sauvegarder les étapes
      </button>
    </div>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function BookingsForm({
  bookings,
  isSaving,
  onSubmit,
  tripId,
}: {
  bookings: BookingTask[];
  isSaving: boolean;
  onSubmit: (bookings: BookingTask[]) => void;
  tripId: string;
}) {
  const [draft, setDraft] = useState<BookingTask[]>(bookings);

  useEffect(() => setDraft(bookings), [bookings]);

  function updateBooking(index: number, nextBooking: BookingTask) {
    setDraft(draft.map((booking, currentIndex) => (currentIndex === index ? nextBooking : booking)));
  }

  function addBooking() {
    setDraft([
      ...draft,
      {
        id: createId("reservation"),
        tripId,
        category: "À classer",
        label: "Nouvelle réservation",
        priority: "medium",
        status: "todo",
      },
    ]);
  }

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <button className="plain-btn icon-text-btn" onClick={addBooking} type="button">
        <Plus aria-hidden="true" size={16} />
        Ajouter une réservation
      </button>
      <div className="editor-list">
        {draft.map((booking, index) => (
          <article className="editor-item" key={booking.id}>
            <div className="editor-item-header">
              <strong>{booking.label}</strong>
              <button
                aria-label="Supprimer la réservation"
                className="icon-btn"
                onClick={() => setDraft(draft.filter((_, currentIndex) => currentIndex !== index))}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>
            <label>Libellé<input onChange={(event) => updateBooking(index, { ...booking, label: event.target.value })} required value={booking.label} /></label>
            <div className="form-row">
              <label>Catégorie<input onChange={(event) => updateBooking(index, { ...booking, category: event.target.value })} required value={booking.category} /></label>
              <label>Échéance<input onChange={(event) => updateBooking(index, { ...booking, dueDate: event.target.value || undefined })} type="date" value={booking.dueDate ?? ""} /></label>
            </div>
            <div className="form-row">
              <label>
                Priorité
                <select onChange={(event) => updateBooking(index, { ...booking, priority: event.target.value as BookingTask["priority"] })} value={booking.priority}>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
              </label>
              <label>
                Statut
                <select onChange={(event) => updateBooking(index, { ...booking, status: event.target.value as BookingTask["status"] })} value={booking.status}>
                  <option value="todo">À faire</option>
                  <option value="booked">Réservé</option>
                  <option value="skipped">Ignoré</option>
                </select>
              </label>
            </div>
            <label>URL externe<input onChange={(event) => updateBooking(index, { ...booking, externalUrl: event.target.value || undefined })} type="url" value={booking.externalUrl ?? ""} /></label>
            <label>Notes<textarea onChange={(event) => updateBooking(index, { ...booking, notes: event.target.value || undefined })} value={booking.notes ?? ""} /></label>
          </article>
        ))}
      </div>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
  );
}

function ExpensesForm({
  expenses,
  folders,
  isSaving,
  onSubmit,
  tripId,
}: {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
  isSaving: boolean;
  onSubmit: (expenses: ExpenseItem[]) => void;
  tripId: string;
}) {
  const [draft, setDraft] = useState<ExpenseItem[]>(expenses);
  const [selectedTripId, setSelectedTripId] = useState(tripId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const trips = folders.flatMap((folder) => folder.trips.map((trip) => ({ id: trip.id, label: trip.title })));

  useEffect(() => {
    setDraft(expenses);
    setEditingId(null);
  }, [expenses]);

  useEffect(() => setSelectedTripId(tripId), [tripId]);

  function updateExpense(expenseId: string, nextExpense: ExpenseItem) {
    setDraft(draft.map((expense) => (expense.id === expenseId ? nextExpense : expense)));
  }

  function addExpense() {
    const nextExpense: ExpenseItem = {
      id: createId("dépense"),
      tripId: selectedTripId === "unassigned" ? undefined : selectedTripId || undefined,
      label: "",
      category: "Transport",
      kind: "planned",
      amount: 0,
      currency: "EUR",
      date: "",
    };
    setDraft([
      nextExpense,
      ...draft,
    ]);
    setEditingId(nextExpense.id);
  }

  function removeExpense(expenseId: string) {
    const expense = draft.find((item) => item.id === expenseId);
    if (!expense) return;
    const confirmed = window.confirm(`Supprimer "${expense.label || "cette dépense"}" ?`);
    if (!confirmed) return;
    setDraft(draft.filter((item) => item.id !== expenseId));
    if (editingId === expenseId) setEditingId(null);
  }

  const visibleExpenses = draft
    .filter((expense) => expense.tripId === selectedTripId || (!expense.tripId && selectedTripId === "unassigned"))
    .sort((left, right) => (right.date ?? "").localeCompare(left.date ?? "") || right.amount - left.amount);

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(
          draft.map((expense) => ({
            ...expense,
            date: expense.date || undefined,
            label: expense.label.trim(),
            category: expense.category.trim(),
            notes: expense.notes?.trim() || undefined,
            tripId: expense.tripId || undefined,
          })),
        );
      }}
    >
      <div className="expense-editor-toolbar">
        <label>
          Voyage à éditer
          <select onChange={(event) => setSelectedTripId(event.target.value)} value={selectedTripId}>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.label}
              </option>
            ))}
            <option value="unassigned">Sans voyage</option>
          </select>
        </label>
        <button className="plain-btn icon-text-btn" onClick={addExpense} type="button">
          <Plus aria-hidden="true" size={16} />
          Ajouter une dépense
        </button>
      </div>
      <div className="editor-list">
        {visibleExpenses.length === 0 && <p className="editor-copy">Aucune dépense pour ce voyage.</p>}
        {visibleExpenses.map((expense) => {
          const isEditing = editingId === expense.id;
          return (
            <article className="editor-item expense-editor-item" key={expense.id}>
              <div className="editor-item-header">
                <div>
                  <strong>{expense.label || "Nouvelle dépense"}</strong>
                  <span>
                    {expense.category} - {expense.kind === "planned" ? "Prévisionnel" : "Passé"} - {expense.amount} EUR
                  </span>
                </div>
                <div className="editor-actions">
                  <button
                    aria-label={isEditing ? "Terminer l'édition" : "Modifier la dépense"}
                    className="icon-btn"
                    onClick={() => setEditingId(isEditing ? null : expense.id)}
                    type="button"
                  >
                    {isEditing ? <Check aria-hidden="true" size={16} /> : <Pencil aria-hidden="true" size={16} />}
                  </button>
                  <button
                    aria-label="Supprimer la dépense"
                    className="icon-btn danger-btn"
                    onClick={() => removeExpense(expense.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
              </div>
              {isEditing && (
                <>
                  <label>
                    Libellé
                    <input
                      onChange={(event) => updateExpense(expense.id, { ...expense, label: event.target.value })}
                      required
                      value={expense.label}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Montant
                      <input
                        min="0"
                        onChange={(event) => updateExpense(expense.id, { ...expense, amount: Number(event.target.value) })}
                        required
                        step="0.01"
                        type="number"
                        value={expense.amount}
                      />
                    </label>
                    <label>
                      Type
                      <select
                        onChange={(event) =>
                          updateExpense(expense.id, { ...expense, kind: event.target.value as ExpenseItem["kind"] })
                        }
                        value={expense.kind}
                      >
                        <option value="planned">Prévisionnel</option>
                        <option value="actual">Passé</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Section
                      <select
                        onChange={(event) => updateExpense(expense.id, { ...expense, category: event.target.value })}
                        value={expense.category}
                      >
                        {expenseCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Date
                      <input
                        onChange={(event) => updateExpense(expense.id, { ...expense, date: event.target.value || undefined })}
                        type="date"
                        value={expense.date ?? ""}
                      />
                    </label>
                  </div>
                  <label>
                    Voyage
                    <select
                      onChange={(event) =>
                        updateExpense(expense.id, {
                          ...expense,
                          tripId: event.target.value === "unassigned" ? undefined : event.target.value,
                        })
                      }
                      value={expense.tripId ?? "unassigned"}
                    >
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.label}
                        </option>
                      ))}
                      <option value="unassigned">Sans voyage</option>
                    </select>
                  </label>
                  <label>
                    Notes
                    <textarea
                      onChange={(event) => updateExpense(expense.id, { ...expense, notes: event.target.value || undefined })}
                      value={expense.notes ?? ""}
                    />
                  </label>
                </>
              )}
            </article>
          );
        })}
      </div>
      <button className="primary-btn expense-save-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
  );
}

function JsonArrayForm<T>({
  copy,
  initialValue,
  isSaving,
  label,
  onSubmit,
}: {
  copy: string;
  initialValue: T[];
  isSaving: boolean;
  label: string;
  onSubmit: (items: T[]) => void;
}) {
  const [draft, setDraft] = useState(JSON.stringify(initialValue, null, 2));

  useEffect(() => setDraft(JSON.stringify(initialValue, null, 2)), [initialValue]);

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(parseJsonArray<T>(draft, label));
      }}
    >
      <p className="editor-copy">{copy}</p>
      <label>{label}<textarea className="json-editor" onChange={(event) => setDraft(event.target.value)} spellCheck={false} value={draft} /></label>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
  );
}
