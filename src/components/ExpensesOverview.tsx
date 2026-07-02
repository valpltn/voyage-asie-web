import type { ExpenseItem, TravelFolder } from "../lib/types";
import { EmptyState } from "./EmptyState";

interface ExpensesOverviewProps {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
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

export function ExpensesOverview({ expenses, folders }: ExpensesOverviewProps) {
  const tripLabels = tripLabelById(folders);
  const plannedExpenses = expenses.filter((expense) => expense.kind === "planned");
  const actualExpenses = expenses.filter((expense) => expense.kind === "actual");
  const plannedTotal = totalFor(expenses, "planned");
  const actualTotal = totalFor(expenses, "actual");

  if (expenses.length === 0) {
    return <EmptyState title="Aucune depense" copy="Ajoute des depenses prevues ou passees pour suivre le budget global." />;
  }

  return (
    <section className="view active">
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
  return (
    <article className="expense-card">
      <h2>{title}</h2>
      {expenses.length === 0 ? (
        <p>Aucune depense enregistree.</p>
      ) : (
        <div className="expense-table">
          {expenses.map((expense) => (
            <div className="expense-row" key={expense.id}>
              <div>
                <strong>{expense.label}</strong>
                <span>
                  {expense.category}
                  {expense.tripId ? ` - ${tripLabels.get(expense.tripId) ?? expense.tripId}` : ""}
                </span>
              </div>
              <strong>{euroFormatter.format(expense.amount)}</strong>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
