import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpensesOverview } from "./ExpensesOverview";
import type { ExpenseItem, TravelFolder } from "../lib/types";

const folders: TravelFolder[] = [
  {
    id: "folder",
    label: "Folder",
    trips: [
      {
        id: "trip-a",
        folderId: "folder",
        title: "Voyage A",
        description: "A",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        status: "planned",
        stats: [],
        steps: [],
        bookings: [],
        documents: [],
      },
      {
        id: "trip-b",
        folderId: "folder",
        title: "Voyage B",
        description: "B",
        startDate: "2026-02-01",
        endDate: "2026-02-02",
        status: "planned",
        stats: [],
        steps: [],
        bookings: [],
        documents: [],
      },
    ],
  },
];

const expenses: ExpenseItem[] = [
  {
    id: "a-transport",
    tripId: "trip-a",
    label: "Train",
    category: "Transport",
    kind: "planned",
    amount: 120,
    currency: "EUR",
    date: "2026-01-01",
  },
  {
    id: "b-hotel",
    tripId: "trip-b",
    label: "Hotel",
    category: "Hebergement",
    kind: "actual",
    amount: 300,
    currency: "EUR",
    date: "2026-02-01",
  },
];

describe("ExpensesOverview", () => {
  it("hides edit action when no admin edit handler is provided", () => {
    render(<ExpensesOverview expenses={expenses} folders={folders} />);

    expect(screen.queryByRole("button", { name: "Modifier les depenses" })).not.toBeInTheDocument();
  });

  it("filters expenses by selected trip and type", () => {
    render(<ExpensesOverview expenses={expenses} folders={folders} onEdit={() => undefined} />);

    expect(screen.getByText("Train")).toBeInTheDocument();
    expect(screen.getByText("Hotel")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Voyage"), { target: { value: "trip-a" } });
    expect(screen.queryByText("Hotel")).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText(/Type/)[0], { target: { value: "actual" } });
    expect(screen.queryByText("Train")).not.toBeInTheDocument();
    expect(screen.queryByText("Hotel")).not.toBeInTheDocument();
  });

  it("sorts visible expenses by amount", () => {
    render(<ExpensesOverview expenses={expenses} folders={folders} />);

    fireEvent.change(screen.getByLabelText("Voyage"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText(/Tri/), { target: { value: "amount-desc" } });

    const rows = screen.getAllByText(/Train|Hotel/).map((item) => within(item.closest(".expense-row") as HTMLElement));
    expect(rows[0].getByText("Hotel")).toBeInTheDocument();
    expect(rows[1].getByText("Train")).toBeInTheDocument();
  });
});
