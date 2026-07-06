import { FormEvent, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { BookingTask, DocumentLink, ExpenseItem, TravelFolder, Trip, TripStat, TripStep } from "../lib/types";

export type EditTarget =
  | { type: "trip" }
  | { type: "stats" }
  | { type: "step"; stepId: string }
  | { type: "bookings" }
  | { type: "documents" }
  | { type: "expenses" };

interface DataEditPanelProps {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
  onClose: () => void;
  onSaveExpenses: (expenses: ExpenseItem[]) => Promise<void>;
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

function parseJsonArray<T>(value: string, label: string): T[] {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error(`${label} doit etre un tableau JSON.`);
  return parsed as T[];
}

const expenseCategories = ["Transport", "Hebergement", "Repas", "Activites", "Documents", "Divers"];

export function DataEditPanel({ expenses, folders, onClose, onSaveExpenses, onSaveTrip, target, trip }: DataEditPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <aside className="edit-panel" aria-label="Edition des donnees">
      <div className="edit-panel-header">
        <div>
          <p className="eyebrow">Edition</p>
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
  if (target.type === "stats") return "Statistiques";
  if (target.type === "step") return "Etape";
  if (target.type === "bookings") return "Reservations";
  if (target.type === "documents") return "Documents";
  return "Depenses";
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
    setMessage("Modifications sauvegardees.");
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
  const [notes, setNotes] = useState(trip.notes ?? "");

  useEffect(() => {
    setTitle(trip.title);
    setDescription(trip.description);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setStatus(trip.status);
    setNotes(trip.notes ?? "");
  }, [trip]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ ...trip, title, description, startDate, endDate, status, notes: notes || undefined });
  }

  return (
    <form className="editor-form" onSubmit={handleSubmit}>
      <label>Titre<input onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
      <label>Description<textarea onChange={(event) => setDescription(event.target.value)} required value={description} /></label>
      <div className="form-row">
        <label>Debut<input onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} /></label>
        <label>Fin<input onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} /></label>
      </div>
      <label>
        Statut
        <select onChange={(event) => setStatus(event.target.value as Trip["status"])} value={status}>
          <option value="draft">Brouillon</option>
          <option value="planned">Planifie</option>
          <option value="active">Actif</option>
          <option value="archived">Archive</option>
        </select>
      </label>
      <label>Notes privees<textarea onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
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
          <label>Libelle<input onChange={(event) => setDraft(draft.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} value={stat.label} /></label>
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

  useEffect(() => {
    setDraft(step);
    setHighlights(arrayToLines(step.highlights));
  }, [step]);

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...draft, highlights: linesToArray(highlights) });
      }}
    >
      <label>Nom<input onChange={(event) => setDraft({ ...draft, label: event.target.value })} required value={draft.label} /></label>
      <label>Nom court<input onChange={(event) => setDraft({ ...draft, shortLabel: event.target.value })} required value={draft.shortLabel} /></label>
      <div className="form-row">
        <label>Pays<input onChange={(event) => setDraft({ ...draft, country: event.target.value })} required value={draft.country} /></label>
        <label>Region<input onChange={(event) => setDraft({ ...draft, region: event.target.value })} required value={draft.region} /></label>
      </div>
      <div className="form-row">
        <label>Debut<input onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} required type="date" value={draft.startDate} /></label>
        <label>Fin<input onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} required type="date" value={draft.endDate} /></label>
      </div>
      <label>Nuits<input onChange={(event) => setDraft({ ...draft, nights: event.target.value })} required value={draft.nights} /></label>
      <label>Transport<textarea onChange={(event) => setDraft({ ...draft, transport: event.target.value })} required value={draft.transport} /></label>
      <label>Temps forts<textarea onChange={(event) => setHighlights(event.target.value)} value={highlights} /></label>
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
    </form>
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
        category: "A classer",
        label: "Nouvelle reservation",
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
        Ajouter une reservation
      </button>
      <div className="editor-list">
        {draft.map((booking, index) => (
          <article className="editor-item" key={booking.id}>
            <div className="editor-item-header">
              <strong>{booking.label}</strong>
              <button
                aria-label="Supprimer la reservation"
                className="icon-btn"
                onClick={() => setDraft(draft.filter((_, currentIndex) => currentIndex !== index))}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>
            <label>Libelle<input onChange={(event) => updateBooking(index, { ...booking, label: event.target.value })} required value={booking.label} /></label>
            <div className="form-row">
              <label>Categorie<input onChange={(event) => updateBooking(index, { ...booking, category: event.target.value })} required value={booking.category} /></label>
              <label>Echeance<input onChange={(event) => updateBooking(index, { ...booking, dueDate: event.target.value || undefined })} type="date" value={booking.dueDate ?? ""} /></label>
            </div>
            <div className="form-row">
              <label>
                Priorite
                <select onChange={(event) => updateBooking(index, { ...booking, priority: event.target.value as BookingTask["priority"] })} value={booking.priority}>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
              </label>
              <label>
                Statut
                <select onChange={(event) => updateBooking(index, { ...booking, status: event.target.value as BookingTask["status"] })} value={booking.status}>
                  <option value="todo">A faire</option>
                  <option value="booked">Reserve</option>
                  <option value="skipped">Ignore</option>
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
      id: createId("depense"),
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
    const confirmed = window.confirm(`Supprimer "${expense.label || "cette depense"}" ?`);
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
          Voyage a editer
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
          Ajouter une depense
        </button>
      </div>
      <div className="editor-list">
        {visibleExpenses.length === 0 && <p className="editor-copy">Aucune depense pour ce voyage.</p>}
        {visibleExpenses.map((expense) => {
          const isEditing = editingId === expense.id;
          return (
            <article className="editor-item expense-editor-item" key={expense.id}>
              <div className="editor-item-header">
                <div>
                  <strong>{expense.label || "Nouvelle depense"}</strong>
                  <span>
                    {expense.category} - {expense.kind === "planned" ? "Previsionnel" : "Passe"} - {expense.amount} EUR
                  </span>
                </div>
                <div className="editor-actions">
                  <button
                    aria-label={isEditing ? "Terminer l'edition" : "Modifier la depense"}
                    className="icon-btn"
                    onClick={() => setEditingId(isEditing ? null : expense.id)}
                    type="button"
                  >
                    {isEditing ? <Check aria-hidden="true" size={16} /> : <Pencil aria-hidden="true" size={16} />}
                  </button>
                  <button
                    aria-label="Supprimer la depense"
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
                    Libelle
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
                        <option value="planned">Previsionnel</option>
                        <option value="actual">Passe</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Categorie
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
      <button className="primary-btn" disabled={isSaving} type="submit">Sauvegarder</button>
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
