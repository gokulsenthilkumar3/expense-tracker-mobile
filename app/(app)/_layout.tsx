import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initDB } from '../../src/db/index';
import { useExpenseStore } from '../../src/store/expenseStore';
import { useCategoryStore } from '../../src/store/categoryStore';
import { useRecurringStore } from '../../src/store/recurringStore';

export default function AppLayout() {
  const loadExpenses   = useExpenseStore((s) => s.loadExpenses);
  const loadCategories = useCategoryStore((s) => s.loadAll);
  const loadRecurring  = useRecurringStore((s) => s.loadAll);
  const loadPending    = useRecurringStore((s) => s.loadPending);

  useEffect(() => {
    (async () => {
      await initDB();
      await Promise.all([loadExpenses(), loadCategories(), loadRecurring(), loadPending()]);
    })();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="expenses/add-expense"
        options={{ presentation: 'modal', headerShown: true, title: 'Add Expense' }}
      />
      <Stack.Screen
        name="expenses/add-recurring"
        options={{ presentation: 'modal', headerShown: true, title: 'Add Recurring' }}
      />
      <Stack.Screen
        name="expenses/[id]"
        options={{ presentation: 'modal', headerShown: true, title: 'Expense Detail' }}
      />
    </Stack>
  );
}
