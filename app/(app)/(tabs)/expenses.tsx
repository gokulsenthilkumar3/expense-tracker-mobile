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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={{ 
              backgroundColor: '#ffffff',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1
            }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#1e293b' }}>
                  {item.note || 'Expense'}
                </Text>
                <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                  {getCategoryName(item.category_id)} • {item.date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ef4444' }}>
                  -₹{item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => removeExpense(item.id)} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#64748b', fontSize: 16 }}>No expenses found.</Text>
            </View>
          }
        />

        <View style={{ position: 'absolute', bottom: 24, right: 24, flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/expenses/add-expense')}
            style={{
              backgroundColor: '#2563eb',
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}
          >
            <Plus {...{ color: "white", size: 24 } as any} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
