import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useState } from 'react';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { useRouter } from 'expo-router';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addExpense } = useExpenseStore();
  const { categories, paymentModes } = useCategoryStore();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentModeId, setPaymentModeId] = useState<number | null>(null);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addExpense({
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        category_id: categoryId,
        subcategory_id: null,
        payment_mode_id: paymentModeId,
        note: note || null,
        tags: null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#334155' }}>Amount (₹)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 12,
            fontSize: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#334155' }}>Note (Optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 12,
            fontSize: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#334155' }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.filter(c => !c.parent_id).map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: categoryId === cat.id ? '#2563eb' : '#e2e8f0',
                borderRadius: 20,
              }}
            >
              <Text style={{ color: categoryId === cat.id ? 'white' : '#475569', fontWeight: '500' }}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#334155' }}>Payment Mode</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {paymentModes.map(mode => (
            <TouchableOpacity
              key={mode.id}
              onPress={() => setPaymentModeId(mode.id)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: paymentModeId === mode.id ? '#2563eb' : '#e2e8f0',
                borderRadius: 20,
              }}
            >
              <Text style={{ color: paymentModeId === mode.id ? 'white' : '#475569', fontWeight: '500' }}>
                {mode.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: '#2563eb',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Save Expense</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
