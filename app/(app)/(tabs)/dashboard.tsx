import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { useEffect } from 'react';

export default function Dashboard() {
  const { logout } = useAuthStore();
  const { expenses, fetchData: fetchExpenses, isLoading } = useExpenseStore();
  const { fetchData: fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#0f172a' }}>Dashboard</Text>
        
        <View style={{ 
          backgroundColor: '#ffffff', 
          padding: 24, 
          borderRadius: 16, 
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2
        }}>
          <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 8 }}>Total Expenses</Text>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#0f172a' }}>
            ₹{totalSpent.toFixed(2)}
          </Text>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#334155' }}>Recent Entries</Text>
          {expenses.slice(0, 5).map(exp => (
            <View key={exp.id} style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e2e8f0'
            }}>
              <View>
                <Text style={{ fontSize: 16, color: '#1e293b' }}>{exp.note || 'No note'}</Text>
                <Text style={{ fontSize: 14, color: '#94a3b8' }}>{exp.date}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#ef4444' }}>-₹{exp.amount}</Text>
            </View>
          ))}
          {expenses.length === 0 && !isLoading && (
            <Text style={{ color: '#64748b' }}>No expenses yet. Start adding!</Text>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={logout}
          style={{
            backgroundColor: '#ef4444',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Lock App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
