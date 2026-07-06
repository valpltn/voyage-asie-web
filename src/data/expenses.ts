import type { ExpenseItem } from "../lib/types";
import { travelExpenseItems } from "./database";
import { weekendExpenseItems } from "./weekendTrips";

export const expenseItems: ExpenseItem[] = [
  ...travelExpenseItems,
  ...weekendExpenseItems,
];
