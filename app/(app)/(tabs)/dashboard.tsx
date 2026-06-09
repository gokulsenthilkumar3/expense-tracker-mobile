import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStats, DashboardStats } from '../../../src/db/queries';
import { useRecurringStore } from '../../../src/store/recurringStore';
import { formatINR } from '../../../src/utils/currency';
import { currentMonth, getMonthBounds } from '../../../src/utils/date';

export default function Dashboard() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { pendingEntries, loadPending } = useRecurringStore();

  const load = useCallback(async (m: string) => {
    const s = await getDashboardStats(m);
    setStats(s);
    await loadPending();
  }, []);

  useEffect(() => { load(month); }, [month]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(month);
    setRefreshing(false);
  };

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const overdue = pendingEntries.filter(
    (e) => e.due_date < new Date().toISOString().split('T')[0]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#01696f" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>ExpenseTracker</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/expenses/add-expense')}>
            <Ionicons name="add-circle" size={32} color="#01696f" />
          </TouchableOpacity>
        </View>

        {/* Month Picker */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
            <Ionicons name="chevron-forward" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.kpiLabel}>Total Spent</Text>
            <Text style={[styles.kpiValue, { color: '#166534' }]}>
              {stats ? formatINR(stats.totalSpent) : '--'}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#fefce8' }]}>
            <Text style={styles.kpiLabel}>Expenses</Text>
            <Text style={[styles.kpiValue, { color: '#854d0e' }]}>
              {stats?.expenseCount ?? '--'}
            </Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#eff6ff' }]}>
            <Text style={styles.kpiLabel}>Pending Dues</Text>
            <Text style={[styles.kpiValue, { color: '#1d4ed8' }]}>
              {stats?.pendingDues ?? '--'}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#fef2f2' }]}>
            <Text style={styles.kpiLabel}>Overdue</Text>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
              {overdue.length}
            </Text>
          </View>
        </View>

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <TouchableOpacity
            style={styles.overdueAlert}
            onPress={() => router.push('/(app)/(tabs)/recurring')}
          >
            <Ionicons name="warning" size={18} color="#b45309" />
            <Text style={styles.overdueAlertText}>
              {overdue.length} payment{overdue.length > 1 ? 's' : ''} overdue — tap to view
            </Text>
          </TouchableOpacity>
        )}

        {/* Top Categories */}
        {stats && stats.topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            {stats.topCategories.map((cat, i) => (
              <View key={i} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: cat.color ?? '#01696f' }]} />
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catAmount}>{formatINR(cat.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Dues */}
        {pendingEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Dues</Text>
            {pendingEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.dueRow}>
                <View>
                  <Text style={styles.dueName}>Entry #{entry.template_id}</Text>
                  <Text style={styles.dueDate}>Due: {entry.due_date}</Text>
                </View>
                <View style={[
                  styles.dueBadge,
                  entry.due_date < new Date().toISOString().split('T')[0]
                    ? styles.badgeOverdue : styles.badgePending
                ]}>
                  <Text style={styles.dueBadgeText}>
                    {entry.due_date < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
            {pendingEntries.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/recurring')}>
                <Text style={styles.seeAll}>See all {pendingEntries.length} dues →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  appName: { fontSize: 22, fontWeight: '800', color: '#01696f' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  monthBtn: { padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginHorizontal: 16, minWidth: 160, textAlign: 'center' },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  kpiCard: { flex: 1, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  kpiLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  overdueAlert: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  overdueAlertText: { color: '#92400e', fontWeight: '600', fontSize: 14, flex: 1 },
  section: { marginHorizontal: 16, marginBottom: 20, backgroundColor: 'white', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 14, color: '#374151' },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  dueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dueName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  dueDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  dueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePending: { backgroundColor: '#dbeafe' },
  badgeOverdue: { backgroundColor: '#fee2e2' },
  dueBadgeText: { fontSize: 11, fontWeight: '700' },
  seeAll: { textAlign: 'center', color: '#01696f', fontWeight: '600', marginTop: 10, fontSize: 14 },
});
