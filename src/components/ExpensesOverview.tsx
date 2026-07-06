import { useMemo, useState } from "react";
import { ArrowDownUp, Filter } from "lucide-react";
import type { ExpenseItem, TravelFolder } from "../lib/types";
import { EditButton } from "./EditButton";
import { EmptyState } from "./EmptyState";

interface ExpensesOverviewProps {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
  onEdit?: () => void;
}

type ExpenseTypeFilter = "all" | ExpenseItem["kind"];
type ExpenseSort = "date-desc" | "amount-desc" | "category" | "kind";

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

function groupExpensesByCategory(expenses: ExpenseItem[]) {
  const groups = new Map<string, ExpenseItem[]>();
  for (const expense of expenses) {
    groups.set(expense.category, [...(groups.get(expense.category) ?? []), expense]);
  }
  return Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      expenses: items,
      total: items.reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category));
}

function sortExpenses(expenses: ExpenseItem[], sort: ExpenseSort) {
  return [...expenses].sort((left, right) => {
    if (sort === "amount-desc") return right.amount - left.amount;
    if (sort === "category") return left.category.localeCompare(right.category) || left.label.localeCompare(right.label);
    if (sort === "kind") return left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label);
    return (right.date ?? "").localeCompare(left.date ?? "") || right.amount - left.amount;
  });
}

function kindLabel(kind: ExpenseItem["kind"]) {
  return kind === "planned" ? "Previsionnel" : "Passe";
}

function formatDate(date?: string) {
  if (!date) return "Sans date";
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export function ExpensesOverview({ expenses, folders, onEdit }: ExpensesOverviewProps) {
  const trips = useMemo(() => allTrips(folders), [folders]);
  const tripLabels = useMemo(() => tripLabelById(folders), [folders]);
  const [tripFilter, setTripFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<ExpenseSort>("date-desc");

  const tripOptions = [
    { id: "all", label: "Tous les voyages" },
    ...trips,
    { id: "unassigned", label: "Sans voyage" },
  ];
  const categories = Array.from(new Set(expenses.map((expense) => expense.category))).sort((left, right) =>
    left.localeCompare(right),
  );
  const selectedTripLabel =
    tripFilter === "all" ? "Budget par voyage" : tripFilter === "unassigned" ? "Sans voyage" : tripLabels.get(tripFilter);
  const filteredExpenses = sortExpenses(
    expenses.filter((expense) => {
      const matchesTrip =
        tripFilter === "all" || (tripFilter === "unassigned" ? !expense.tripId : expense.tripId === tripFilter);
      const matchesType = typeFilter === "all" || expense.kind === typeFilter;
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
      return matchesTrip && matchesType && matchesCategory;
    }),
    sort,
  );
  const plannedTotal = totalFor(filteredExpenses, "planned");
  const actualTotal = totalFor(filteredExpenses, "actual");
  const groupedExpenses = groupExpensesByCategory(filteredExpenses);

  if (expenses.length === 0) {
    return <EmptyState title="Aucune depense" copy="Connecte-toi en mode admin pour ajouter le premier budget." />;
  }

  return (
    <section className="view active">
      <div className="expense-header">
        <div>
          <p className="eyebrow">Depenses</p>
          <h2>{selectedTripLabel}</h2>
        </div>
        {onEdit && <EditButton label="Modifier les depenses" onClick={onEdit} />}
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
          <span>Reste / ecart</span>
          <strong>{euroFormatter.format(plannedTotal - actualTotal)}</strong>
        </article>
        <article>
          <span>Lignes</span>
          <strong>{filteredExpenses.length}</strong>
        </article>
      </div>

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
        <label>
          <span className="filter-label-icon">
            <Filter aria-hidden="true" size={14} />
            Type
          </span>
          <select onChange={(event) => setTypeFilter(event.target.value as ExpenseTypeFilter)} value={typeFilter}>
            <option value="all">Tous</option>
            <option value="planned">Previsionnel</option>
            <option value="actual">Passe</option>
          </select>
        </label>
        <label>
          Categorie
          <select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            <option value="all">Toutes</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="filter-label-icon">
            <ArrowDownUp aria-hidden="true" size={14} />
            Tri
          </span>
          <select onChange={(event) => setSort(event.target.value as ExpenseSort)} value={sort}>
            <option value="date-desc">Plus recent</option>
            <option value="amount-desc">Plus cher</option>
            <option value="category">Categorie</option>
            <option value="kind">Type</option>
          </select>
        </label>
      </div>

      {filteredExpenses.length === 0 ? (
        <EmptyState title="Aucune depense trouvee" copy="Ajuste les filtres pour afficher d'autres lignes budgetaires." />
      ) : (
        <div className="expense-category-list">
          {groupedExpenses.map((group) => (
            <article className="expense-card" key={group.category}>
              <div className="expense-card-heading">
                <h3>{group.category}</h3>
                <strong>{euroFormatter.format(group.total)}</strong>
              </div>
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
