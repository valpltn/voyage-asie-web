import { useEffect, useMemo, useState } from "react";
import { Filter, Pencil, PieChart } from "lucide-react";
import type { ExpenseItem, TravelFolder } from "../lib/types";
import { EmptyState } from "./EmptyState";

interface ExpensesOverviewProps {
  activeTripId?: string;
  expenses: ExpenseItem[];
  folders: TravelFolder[];
  onEdit?: () => void;
}

type ExpenseTypeFilter = "all" | ExpenseItem["kind"];

const pieColors = ["#1f6f4f", "#e7bd5b", "#83aa4f", "#b96b52", "#4f8faa", "#8f6f2f", "#6e8f4f", "#9a7fb8"];

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 0,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function totalFor(expenses: ExpenseItem[], kind: ExpenseItem["kind"]) {
  return expenses.filter((expense) => expense.kind === kind).reduce((sum, expense) => sum + expense.amount, 0);
}

function allTrips(folders: TravelFolder[]) {
  return folders.flatMap((folder) => folder.trips.map((trip) => ({ id: trip.id, label: trip.title })));
}

function tripLabelById(folders: TravelFolder[]) {
  return new Map(allTrips(folders).map((trip) => [trip.id, trip.label] as const));
}

function kindLabel(kind: ExpenseItem["kind"]) {
  return kind === "planned" ? "Prévisionnelle" : "Passée";
}

function formatDate(date?: string) {
  if (!date) return "Sans date";
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function groupBySection(expenses: ExpenseItem[]) {
  const groups = new Map<string, ExpenseItem[]>();
  for (const expense of expenses) {
    groups.set(expense.category, [...(groups.get(expense.category) ?? []), expense]);
  }

  return Array.from(groups.entries())
    .map(([label, items]) => ({
      actual: totalFor(items, "actual"),
      expenses: items.sort((left, right) => (right.date ?? "").localeCompare(left.date ?? "") || right.amount - left.amount),
      label,
      planned: totalFor(items, "planned"),
      total: items.reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label));
}

function pieGradient(slices: Array<{ color: string; percent: number }>) {
  if (slices.length === 0) return "conic-gradient(#d7e4d2 0 100%)";
  let cursor = 0;
  const parts = slices.map((slice) => {
    const start = cursor;
    const end = cursor + slice.percent;
    cursor = end;
    return `${slice.color} ${start}% ${end}%`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}

export function ExpensesOverview({ activeTripId, expenses, folders, onEdit }: ExpensesOverviewProps) {
  const trips = useMemo(() => allTrips(folders), [folders]);
  const tripLabels = useMemo(() => tripLabelById(folders), [folders]);
  const [tripFilter, setTripFilter] = useState(activeTripId ?? "all");
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>("all");

  useEffect(() => {
    if (activeTripId) setTripFilter(activeTripId);
  }, [activeTripId]);

  const tripOptions = [
    { id: "all", label: "Tous les voyages" },
    ...trips,
    { id: "unassigned", label: "Sans voyage" },
  ];
  const filteredExpenses = expenses.filter((expense) => {
    const matchesTrip = tripFilter === "all" || (tripFilter === "unassigned" ? !expense.tripId : expense.tripId === tripFilter);
    const matchesType = typeFilter === "all" || expense.kind === typeFilter;
    return matchesTrip && matchesType;
  });
  const plannedTotal = totalFor(filteredExpenses, "planned");
  const actualTotal = totalFor(filteredExpenses, "actual");
  const groupedExpenses = groupBySection(filteredExpenses);
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const selectedTripLabel =
    tripFilter === "all" ? "Bilan global" : tripFilter === "unassigned" ? "Sans voyage" : tripLabels.get(tripFilter);

  return (
    <section className="view active">
      <div className="expense-header">
        <div>
          <p className="eyebrow">Dépenses</p>
          <h2>{selectedTripLabel}</h2>
        </div>
        {onEdit && (
          <button className="primary-btn icon-text-btn" onClick={onEdit} type="button">
            <Pencil aria-hidden="true" size={16} />
            Ajouter / éditer
          </button>
        )}
      </div>

      <div className="expense-summary">
        <article>
          <span>Prévisionnelle</span>
          <strong>{euroFormatter.format(plannedTotal)}</strong>
        </article>
        <article>
          <span>Passée</span>
          <strong>{euroFormatter.format(actualTotal)}</strong>
        </article>
        <article>
          <span>Total</span>
          <strong>{euroFormatter.format(total)}</strong>
        </article>
        <article>
          <span>Lignes</span>
          <strong>{filteredExpenses.length}</strong>
        </article>
      </div>

      <div className="filterbar expense-filterbar compact" aria-label="Filtres dépenses">
        <label>
          Voyage
          <select onChange={(event) => setTripFilter(event.target.value)} value={tripFilter}>
            {tripOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="filter-label-icon">
            <Filter aria-hidden="true" size={14} />
            Catégorie
          </span>
          <select onChange={(event) => setTypeFilter(event.target.value as ExpenseTypeFilter)} value={typeFilter}>
            <option value="all">Toutes</option>
            <option value="planned">Prévisionnelle</option>
            <option value="actual">Passée</option>
          </select>
        </label>
      </div>

      <div className="expense-split-layout">
        <div className="expense-left-pane">
          {filteredExpenses.length === 0 ? (
            <EmptyState title="Aucune dépense" copy="Ajoute tes premières dépenses depuis le mode admin." />
          ) : (
            <div className="expense-accordion-list">
              {groupedExpenses.map((group) => (
                <details className="expense-section" key={group.label} open>
                  <summary>
                    <span>{group.label}</span>
                    <strong>{euroFormatter.format(group.total)}</strong>
                  </summary>
                  <div className="expense-table">
                    {group.expenses.map((expense) => (
                      <div className="expense-row" key={expense.id}>
                        <div className="expense-row-main">
                          <strong>{expense.label}</strong>
                          <span>
                            {tripLabels.get(expense.tripId ?? "") ?? "Sans voyage"} - {formatDate(expense.date)}
                          </span>
                          {expense.notes && <small>{expense.notes}</small>}
                        </div>
                        <span className={`expense-kind ${expense.kind}`}>{kindLabel(expense.kind)}</span>
                        <strong>{euroFormatter.format(expense.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        <aside className="expense-pie-panel">
          <div className="expense-card expense-pie-card">
            <div className="expense-card-heading">
              <h3>
                <span className="filter-label-icon">
                  <PieChart aria-hidden="true" size={17} />
                  Répartition
                </span>
              </h3>
              <strong>{euroFormatter.format(total)}</strong>
            </div>
            <ExpensePie rows={groupedExpenses.map((group) => ({ label: group.label, total: group.total }))} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function ExpensePie({ rows }: { rows: Array<{ label: string; total: number }> }) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const slices = total
    ? rows.map((row, index) => ({
        color: pieColors[index % pieColors.length],
        label: row.label,
        percent: (row.total / total) * 100,
        total: row.total,
      }))
    : [];

  return (
    <div className="expense-pie-wrap">
      <div className="expense-pie" style={{ background: pieGradient(slices) }}>
        {slices.map((slice) => (
          <span
            key={slice.label}
            style={{ background: slice.color }}
            title={`${slice.label}: ${slice.percent.toFixed(1)}% (${euroFormatter.format(slice.total)})`}
          />
        ))}
      </div>
      {slices.length === 0 ? (
        <p className="expense-pie-empty">Aucune donnée</p>
      ) : (
        <div className="expense-pie-legend">
          {slices.map((slice) => (
            <div key={slice.label} title={`${slice.label}: ${slice.percent.toFixed(1)}%`}>
              <span style={{ background: slice.color }} />
              <strong>{slice.label}</strong>
              <em>{slice.percent.toFixed(1)}%</em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
