import { create } from 'zustand';
import {
  getExpenses,
  addExpense,
  Expense,
  ExpenseInsert,
  getRecurringTemplates,
  addRecurringTemplate,
  RecurringTemplate,
  RecurringTemplateInsert,
  deleteExpense,
  deleteRecurringTemplate,
  markRecurringPaid,
  updateExpense,
} from '../db/queries';

interface ExpenseState {
  expenses: Expense[];
  recurringTemplates: RecurringTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  addExpense: (expense: ExpenseInsert) => Promise<void>;
  editExpense: (id: number, expense: ExpenseInsert) => Promise<void>;
  removeExpense: (id: number) => Promise<void>;
  addRecurringTemplate: (template: RecurringTemplateInsert) => Promise<void>;
  removeRecurringTemplate: (id: number) => Promise<void>;
  markRecurringPaid: (id: number, amount: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  recurringTemplates: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [expenses, recurringTemplates] = await Promise.all([
        getExpenses(),
        getRecurringTemplates(),
      ]);
      set({ expenses, recurringTemplates, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch data', isLoading: false });
    }
  },

  addExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      await addExpense(expense);
      await get().fetchData();
    } catch (error: any) {
      set({ error: error.message || 'Failed to add expense', isLoading: false });
    }
  },

  editExpense: async (id, expense) => {
    set({ isLoading: true, error: null });
    try {
      await updateExpense(id, expense);
      await get().fetchData();
    } catch (error: any) {
      set({ error: error.message || 'Failed to update expense', isLoading: false });
    }
  },

  removeExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteExpense(id);
      await get().fetchData();
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete expense', isLoading: false });
    }
  },

  addRecurringTemplate: async (template) => {
    set({ isLoading: true, error: null });
    try {
      await addRecurringTemplate(template);
      await get().fetchData();
    } catch (error: any) {
      set({ error: error.message || 'Failed to add recurring template', isLoading: false });
    }
  },

  removeRecurringTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteRecurringTemplate(id);
      await get().fetchData();
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete recurring template', isLoading: false });
    }
  },

  markRecurringPaid: async (id, amount) => {
    set({ isLoading: true, error: null });
    try {
      await markRecurringPaid(id, amount);
      await get().fetchData();
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark as paid', isLoading: false });
    }
  },
}));
