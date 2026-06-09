import { create } from 'zustand';
import {
  getExpensesWithDetails, addExpense as dbAdd,
  updateExpense as dbUpdate, deleteExpense as dbDelete,
  getExpensesByDateRange,
  ExpenseWithDetails, ExpenseInsert,
} from '../db/queries';

interface ExpenseStore {
  expenses: ExpenseWithDetails[];
  loading: boolean;

  loadExpenses: () => Promise<void>;
  loadByRange: (start: string, end: string) => Promise<ExpenseWithDetails[]>;
  addExpense: (expense: ExpenseInsert) => Promise<number>;
  updateExpense: (id: number, fields: Partial<ExpenseInsert>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  loading: false,

  loadExpenses: async () => {
    set({ loading: true });
    const expenses = await getExpensesWithDetails();
    set({ expenses, loading: false });
  },

  loadByRange: async (start, end) => {
    return getExpensesByDateRange(start, end);
  },

  addExpense: async (expense) => {
    const id = await dbAdd(expense);
    const expenses = await getExpensesWithDetails();
    set({ expenses });
    return id;
  },

  updateExpense: async (id, fields) => {
    await dbUpdate(id, fields);
    const expenses = await getExpensesWithDetails();
    set({ expenses });
  },

  deleteExpense: async (id) => {
    await dbDelete(id);
    const expenses = await getExpensesWithDetails();
    set({ expenses });
  },
}));
