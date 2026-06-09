import { create } from 'zustand';
import { getCategories, getPaymentModes, Category, PaymentMode } from '../db/queries';

interface CategoryState {
  categories: Category[];
  paymentModes: PaymentMode[];
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  paymentModes: [],
  isLoading: false,
  error: null,
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [categories, paymentModes] = await Promise.all([
        getCategories(),
        getPaymentModes(),
      ]);
      set({ categories, paymentModes, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch categories', isLoading: false });
    }
  },
}));
