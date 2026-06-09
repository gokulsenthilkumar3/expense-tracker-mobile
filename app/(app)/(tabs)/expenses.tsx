import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ExpensesScreen() {
  const { expenses, removeExpense } = useExpenseStore();
  const { categories } = useCategoryStore();
  const router = useRouter();

  const getCategoryName = (id: number | null) => {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name || 'Unknown';
  };

  const getCategoryIcon = (id: number | null) => {
    if (!id) return '📦';
    return categories.find(c => c.id === id)?.icon ?? '📦';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/expenses/${item.id}`)}
              activeOpacity={0.75}
              style={{
                backgroundColor: '#ffffff',
                padding: 16,
                borderRadius: 14,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              {/* Left: icon + info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 12,
                  backgroundColor: '#f1f5f9',
                  justifyContent: 'center', alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 20 }}>{getCategoryIcon(item.category_id)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b' }} numberOfLines={1}>
                    {item.note || 'Expense'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    {getCategoryName(item.category_id)} · {item.date}
                  </Text>
                </View>
              </View>
              {/* Right: amount */}
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444', marginLeft: 8 }}>
                -₹{item.amount.toFixed(0)}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40 }}>💸</Text>
              <Text style={{ color: '#64748b', fontSize: 16, marginTop: 16, fontWeight: '500' }}>No expenses yet</Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>Tap + to add your first one.</Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/expenses/add-expense')}
          style={{
            position: 'absolute', bottom: 24, right: 24,
            backgroundColor: '#2563eb',
            width: 56, height: 56, borderRadius: 28,
            justifyContent: 'center', alignItems: 'center',
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
          }}
        >
          <Plus {...{ color: 'white', size: 24 } as any} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
