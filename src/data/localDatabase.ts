import type { ExpenseItem, TravelFolder } from "../lib/types";
import { expenseItems } from "./expenses";
import { travelFolders } from "./travelData";

export interface LocalDatabaseSnapshot {
  expenses: ExpenseItem[];
  folders: TravelFolder[];
}

export const localDatabase: LocalDatabaseSnapshot = {
  expenses: expenseItems,
  folders: travelFolders,
};
