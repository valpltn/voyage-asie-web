import type { ExpenseItem } from "../lib/types";
import { weekendExpenseItems } from "./weekendTrips";

export const expenseItems: ExpenseItem[] = [
  ...weekendExpenseItems,
  // Add actual expenses here as they happen, with kind: "actual".
];
