import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { RecurringTemplate } from '../../../src/db/queries';
import { Plus, RefreshCw, CheckCircle, Trash2, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// ─── helpers ──────────────────────────────────────────────────────────────────

type DueStatus = 'overdue' | 'due-soon' | 'ok' | 'completed' | 'paused';

function getDueStatus(t: RecurringTemplate): DueStatus {
  if (t.status === 'completed') return 'completed';
  if (t.status === 'paused')    return 'paused';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due  = new Date(t.next_due_date);
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return 'overdue';
  if (diff <= 3) return 'due-soon';
  return 'ok';
}

const DUE_BADGE: Record<DueStatus, { bg: string; text: string; label: string }> = {
  overdue:   { bg: '#fef2f2', text: '#dc2626', label: 'Overdue'   },
  'due-soon':{ bg: '#fffbeb', text: '#d97706', label: 'Due Soon'  },
  ok:        { bg: '#f0fdf4', text: '#16a34a', label: 'On Track'  },
  completed: { bg: '#f8fafc', text: '#64748b', label: 'Completed' },
  paused:    { bg: '#f8fafc', text: '#94a3b8', label: 'Paused'    },
};

type FilterType = 'all' | 'fixed' | 'installment' | 'variable';

const TYPE_LABEL: Record<RecurringTemplate['type'], string> = {
  fixed:       'Fixed',
  installment: 'Installment',
  variable:    'Variable',
};

const TYPE_COLOR: Record<RecurringTemplate['type'], string> = {
  fixed:       '#2563eb',
  installment: '#7c3aed',
  variable:    '#0891b2',
};

function formatAmount(t: RecurringTemplate): string {
  if (t.type === 'variable') {
    return `₹${t.min_amount ?? 0}–₹${t.max_amount ?? 0}`;
  }
  if (t.type === 'installment') {
    return `₹${(t.installment_amt ?? t.amount ?? 0).toFixed(0)}/inst`;
  }
  return `₹${(t.amount ?? 0).toFixed(0)}`;
}

function progressBar(t: RecurringTemplate) {
  if (t.type !== 'installment' || !t.total_periods) return null;
  const pct = Math.min((t.paid_periods / t.total_periods) * 100, 100);
  return { pct, paid: t.paid_periods, total: t.total_periods };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function RecurringScreen() {
  const { recurringTemplates, isLoading, fetchData, removeRecurringTemplate, markRecurringPaid } =
    useExpenseStore();
  const { categories } = useCategoryStore();
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => { fetchData(); }, []);

  const getCategoryName = (id: number | null) => {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name ?? 'Unknown';
  };

  const filtered = filter === 'all'
    ? recurringTemplates
    : recurringTemplates.filter(t => t.type === filter);

  const handleMarkPaid = (t: RecurringTemplate) => {
    Alert.alert(
      'Mark as Paid',
      `Mark "${t.name}" as paid for this cycle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => markRecurringPaid(t.id, t.amount ?? t.installment_amt ?? 0),
        },
      ]
    );
  };

  const handleDelete = (t: RecurringTemplate) => {
    Alert.alert(
      'Delete Recurring',
      `Delete "${t.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeRecurringTemplate(t.id),
        },
      ]
    );
  };

  const renderItem = ({ item: t }: { item: RecurringTemplate }) => {
    const status = getDueStatus(t);
    const badge  = DUE_BADGE[status];
    const prog   = progressBar(t);
    const canPay = t.status === 'active';

    return (
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}>
        {/* Row 1: name + amount + badge */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>
              {t.name}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {getCategoryName(t.category_id)} • {t.frequency}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
              {formatAmount(t)}
            </Text>
            <View style={{ backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: badge.text }}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {/* Type chip + due date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
          <View style={{ backgroundColor: TYPE_COLOR[t.type] + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: TYPE_COLOR[t.type] }}>
              {TYPE_LABEL[t.type]}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Calendar {...{ size: 12, color: '#94a3b8' } as any} />
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>Due: {t.next_due_date}</Text>
          </View>
        </View>

        {/* Installment progress bar */}
        {prog && (
          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Progress</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{prog.paid}/{prog.total} paid</Text>
            </View>
            <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 }}>
              <View style={{ width: `${prog.pct}%`, height: 6, backgroundColor: '#7c3aed', borderRadius: 3 }} />
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          {canPay && (
            <TouchableOpacity
              onPress={() => handleMarkPaid(t)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#16a34a',
                paddingVertical: 9,
                borderRadius: 10,
              }}
            >
              <CheckCircle {...{ size: 15, color: 'white' } as any} />
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>Mark Paid</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleDelete(t)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#fca5a5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 {...{ size: 15, color: '#ef4444' } as any} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flex: 1 }}>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 8 }}>
          {(['all', 'fixed', 'installment', 'variable'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: filter === f ? '#2563eb' : '#e2e8f0',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#ffffff' : '#475569', textTransform: 'capitalize' }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary strip */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 12,
          marginBottom: 4,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 12,
          gap: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}>
          {[
            { label: 'Total',     value: recurringTemplates.length,                                       color: '#0f172a' },
            { label: 'Overdue',   value: recurringTemplates.filter(t => getDueStatus(t) === 'overdue').length,   color: '#dc2626' },
            { label: 'Due Soon',  value: recurringTemplates.filter(t => getDueStatus(t) === 'due-soon').length, color: '#d97706' },
            { label: 'On Track',  value: recurringTemplates.filter(t => getDueStatus(t) === 'ok').length,       color: '#16a34a' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 100 }}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <RefreshCw {...{ size: 40, color: '#cbd5e1' } as any} />
                <Text style={{ color: '#64748b', fontSize: 16, marginTop: 16, fontWeight: '500' }}>No recurring entries yet</Text>
                <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 6, textAlign: 'center' }}>Tap + to add loans,\nchit funds, or regular bills.</Text>
              </View>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/expenses/add-recurring')}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#7c3aed',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Plus {...{ size: 26, color: 'white' } as any} />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
