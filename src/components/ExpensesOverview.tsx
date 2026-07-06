import { useMemo, useState } from "react";
import type { ExpenseItem, TravelFolder } from "../lib/types";
import { EditButton } from "./EditButton";
import { EmptyState } from "./EmptyState";

interface ExpensesOverviewProps {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
  onEdit?: () => void;
}

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 0,
  style: "currency",
});

function totalFor(expenses: ExpenseItem[], kind: ExpenseItem["kind"]) {
  return expenses.filter((expense) => expense.kind === kind).reduce((sum, expense) => sum + expense.amount, 0);
}

function tripLabelById(folders: TravelFolder[]) {
  return new Map(folders.flatMap((folder) => folder.trips.map((trip) => [trip.id, trip.title] as const)));
}

function groupExpensesByTrip(expenses: ExpenseItem[], tripLabels: Map<string, string>) {
  const groups = new Map<string, { id: string; label: string; expenses: ExpenseItem[] }>();

  for (const expense of expenses) {
    const key = expense.tripId ?? "unassigned";
    const label = expense.tripId ? tripLabels.get(expense.tripId) ?? expense.tripId : "Sans voyage";
    const group = groups.get(key) ?? { id: key, label, expenses: [] };
    group.expenses.push(expense);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

export function ExpensesOverview({ expenses, folders, onEdit }: ExpensesOverviewProps) {
  const [tripFilter, setTripFilter] = useState("all");
  const tripLabels = tripLabelById(folders);
  const tripOptions = useMemo(
    () => [
      { id: "all", label: "Tous les voyages" },
      ...folders.flatMap((folder) => folder.trips.map((trip) => ({ id: trip.id, label: trip.title }))),
      { id: "unassigned", label: "Sans voyage" },
    ],
    [folders],
  );
  const filteredExpenses = expenses.filter((expense) => {
    if (tripFilter === "all") return true;
    if (tripFilter === "unassigned") return !expense.tripId;
    return expense.tripId === tripFilter;
  });
  const plannedExpenses = filteredExpenses.filter((expense) => expense.kind === "planned");
  const actualExpenses = filteredExpenses.filter((expense) => expense.kind === "actual");
  const plannedTotal = totalFor(filteredExpenses, "planned");
  const actualTotal = totalFor(filteredExpenses, "actual");
  const tripSummaries = groupExpensesByTrip(expenses, tripLabels).map((group) => {
    const planned = totalFor(group.expenses, "planned");
    const actual = totalFor(group.expenses, "actual");
    return { ...group, actual, balance: planned - actual, planned };
  });

  if (expenses.length === 0) {
    return <EmptyState title="Aucune depense" copy="Ajoute des depenses prevues ou passees pour suivre le budget global." />;
  }

  return (
    <section className="view active">
      {onEdit && (
        <div className="view-actions">
          <EditButton label="Modifier les depenses" onClick={onEdit} />
        </div>
      )}
      <div className="filterbar expense-filterbar" aria-label="Filtres depenses">
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
      </div>
      <div className="expense-summary">
        <article>
          <span>Previsionnel</span>
          <strong>{euroFormatter.format(plannedTotal)}</strong>
        </article>
        <article>
          <span>Passe</span>
          <strong>{euroFormatter.format(actualTotal)}</strong>
        </article>
        <article>
          <span>Ecart</span>
          <strong>{euroFormatter.format(plannedTotal - actualTotal)}</strong>
        </article>
      </div>

      {tripFilter === "all" && (
        <article className="expense-card expense-overview-card">
          <h2>Bilan par voyage</h2>
          <div className="expense-table">
            {tripSummaries.map((summary) => (
              <div className="expense-balance-row" key={summary.id}>
                <strong>{summary.label}</strong>
                <span>Prevu: {euroFormatter.format(summary.planned)}</span>
                <span>Passe: {euroFormatter.format(summary.actual)}</span>
                <strong>{euroFormatter.format(summary.balance)}</strong>
              </div>
            ))}
          </div>
        </article>
      )}

      <div className="expense-columns">
        <ExpenseTable title="Depenses previsionnelles" expenses={plannedExpenses} tripLabels={tripLabels} />
        <ExpenseTable title="Depenses passees" expenses={actualExpenses} tripLabels={tripLabels} />
      </div>
    </section>
  );
}

function ExpenseTable({
  expenses,
  title,
  tripLabels,
}: {
  expenses: ExpenseItem[];
  title: string;
  tripLabels: Map<string, string>;
}) {
  const groupedExpenses = groupExpensesByTrip(expenses, tripLabels);

  return (
    <article className="expense-card">
      <h2>{title}</h2>
      {expenses.length === 0 ? (
        <p>Aucune depense enregistree.</p>
      ) : (
        <div className="expense-table">
          {groupedExpenses.map((group) => (
            <div className="expense-trip-group" key={group.label}>
              <h3>{group.label}</h3>
              {group.expenses.map((expense) => (
                <div className="expense-row" key={expense.id}>
                  <div>
                    <strong>{expense.label}</strong>
                    <span>{expense.category}</span>
                  </div>
                  <strong>{euroFormatter.format(expense.amount)}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
