import { Stack } from 'expo-router';

export default function AppLayout() {
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
        options={{ presentation: 'card', headerShown: false, title: 'Expense Detail' }}
      />
    </Stack>
  );
}
