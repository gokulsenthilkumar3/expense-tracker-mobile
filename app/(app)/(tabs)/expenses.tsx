import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { formatINR } from '../../../src/utils/currency';
import { currentMonth } from '../../../src/utils/date';
import { ExpenseWithDetails } from '../../../src/db/queries';

const MONTHS: { label: string; value: string }[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), value };
});

export default function Expenses() {
  const router = useRouter();
  const { expenses, loadExpenses, deleteExpense } = useExpenseStore();
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [refreshing, setRefreshing] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useFocusEffect(useCallback(() => { loadExpenses(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadExpenses(); setRefreshing(false); };

  const filtered = expenses.filter((e) => {
    const matchMonth = e.date.startsWith(month);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.category_name?.toLowerCase().includes(q) ||
      e.note?.toLowerCase().includes(q) ||
      String(e.amount).includes(q);
    return matchMonth && matchSearch;
  });

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const handleDelete = (item: ExpenseWithDetails) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(item.id) },
    ]);
  };

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/expenses/add-expense')}>
          <Ionicons name="add-circle" size={28} color="#01696f" />
        </TouchableOpacity>
      </View>

      {/* Month Nav */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={18} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMonthPicker(!showMonthPicker)}>
          <Text style={styles.monthLabel}>
            {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
          <Ionicons name="chevron-forward" size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color="#9ca3af" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category, note, amount…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>{filtered.length} entries</Text>
        <Text style={styles.summaryTotal}>{formatINR(total)}</Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#01696f" />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No expenses</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first expense</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/expenses/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          >
            <View style={[styles.catCircle, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="receipt-outline" size={18} color="#01696f" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardCategory}>{item.category_name ?? 'Uncategorized'}</Text>
              {item.subcategory_name && (
                <Text style={styles.cardSubcategory}>{item.subcategory_name}</Text>
              )}
              <Text style={styles.cardMeta}>
                {item.date}{item.payment_mode_name ? ` · ${item.payment_mode_name}` : ''}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
            </View>
            <Text style={styles.cardAmount}>{formatINR(item.amount)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  monthBtn: { padding: 8 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#374151', minWidth: 160, textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#374151' },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 6 },
  summaryText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  summaryTotal: { fontSize: 13, color: '#01696f', fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  catCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardCategory: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardSubcategory: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  cardMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#01696f' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af' },
});
