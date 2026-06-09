import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { Expense, ExpenseInsert } from '../../../src/db/queries';
import { Pencil, Trash2, Check, X, Calendar, Tag, CreditCard, FileText } from 'lucide-react-native';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {text}{required && <Text style={{ color: '#dc2626' }}> *</Text>}
    </Text>
  );
}

function DetailRow({
  icon, label, value, accent,
}: {
  icon: React.ReactNode; label: string; value: string; accent?: string;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '500', color: accent ?? '#0f172a' }}>{value}</Text>
      </View>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
      marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    }}>
      {children}
    </View>
  );
}

function ChipGroup<T extends string>({
  options, selected, onSelect, activeColor = '#2563eb',
}: {
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (v: T) => void;
  activeColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onSelect(o.value)}
          style={{
            paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20,
            backgroundColor: selected === o.value ? activeColor : '#e2e8f0',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: selected === o.value ? '#fff' : '#475569' }}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { expenses, removeExpense, editExpense } = useExpenseStore();
  const { categories, paymentModes, fetchData: fetchCats } = useCategoryStore();

  const [isEdit,    setIsEdit]    = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [isDeleting,setIsDeleting]= useState(false);

  // find the expense in store
  const expense: Expense | undefined = expenses.find(e => e.id === Number(id));

  // edit fields (pre-filled when entering edit mode)
  const [amount,        setAmount]        = useState('');
  const [date,          setDate]          = useState('');
  const [categoryId,    setCategoryId]    = useState<number | null>(null);
  const [paymentModeId, setPaymentModeId] = useState<number | null>(null);
  const [note,          setNote]          = useState('');
  const [tags,          setTags]          = useState('');

  useEffect(() => { fetchCats(); }, []);

  // Populate edit fields when entering edit mode
  const enterEdit = () => {
    if (!expense) return;
    setAmount(String(expense.amount));
    setDate(expense.date);
    setCategoryId(expense.category_id);
    setPaymentModeId(expense.payment_mode_id);
    setNote(expense.note ?? '');
    setTags(expense.tags ?? '');
    setIsEdit(true);
  };

  const cancelEdit = () => setIsEdit(false);

  // ── helpers
  const getCategoryName = (cid: number | null) =>
    cid ? (categories.find(c => c.id === cid)?.name ?? 'Unknown') : 'Uncategorized';
  const getPaymentName = (pid: number | null) =>
    pid ? (paymentModes.find(p => p.id === pid)?.name ?? 'Unknown') : 'Not specified';

  // ── save edit
  const handleSave = async () => {
    if (!expense) return;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount.'); return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Validation', 'Date must be in YYYY-MM-DD format.'); return;
    }
    setIsSaving(true);
    try {
      await editExpense(expense.id, {
        amount:          Number(amount),
        date,
        category_id:     categoryId,
        subcategory_id:  expense.subcategory_id,
        payment_mode_id: paymentModeId,
        note:            note.trim() || null,
        tags:            tags.trim() || null,
      });
      setIsEdit(false);
    } catch {
      Alert.alert('Error', 'Failed to update expense.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── delete
  const handleDelete = () => {
    if (!expense) return;
    Alert.alert(
      'Delete Expense',
      `Delete this ₹${expense.amount} expense? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await removeExpense(expense.id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ── loading / not found
  if (!expense) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Loading expense…</Text>
      </SafeAreaView>
    );
  }

  const parentCategories = categories.filter(c => !c.parent_id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>

      {/* ── Header bar ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 6 }}>
          <X {...{ size: 20, color: '#64748b' } as any} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a' }}>
          {isEdit ? 'Edit Expense' : 'Expense Detail'}
        </Text>
        {!isEdit ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={enterEdit}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#eff6ff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
              }}
            >
              <Pencil {...{ size: 14, color: '#2563eb' } as any} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#fef2f2', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
              }}
            >
              {isDeleting
                ? <ActivityIndicator size="small" color="#ef4444" />
                : <Trash2 {...{ size: 14, color: '#ef4444' } as any} />}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={cancelEdit}
              style={{
                paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                backgroundColor: '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                backgroundColor: isSaving ? '#93c5fd' : '#2563eb',
              }}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Check {...{ size: 14, color: '#fff' } as any} />}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Amount hero card ── */}
        <View style={{
          backgroundColor: '#1e293b',
          borderRadius: 20,
          padding: 28,
          alignItems: 'center',
          marginBottom: 20,
          shadowColor: '#1e293b',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}>
          {isEdit ? (
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#475569"
              style={{
                fontSize: 42, fontWeight: '800', color: '#f8fafc',
                textAlign: 'center', borderBottomWidth: 2,
                borderBottomColor: '#3b82f6', paddingBottom: 4, minWidth: 160,
              }}
            />
          ) : (
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#f8fafc' }}>
              {formatAmount(expense.amount)}
            </Text>
          )}
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            Added {new Date(expense.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* ── VIEW mode: detail rows ── */}
        {!isEdit && (
          <SectionCard>
            <DetailRow
              icon={<Calendar {...{ size: 16, color: '#2563eb' } as any} />}
              label="Date"
              value={formatDate(expense.date)}
            />
            <DetailRow
              icon={<Text style={{ fontSize: 14 }}>{categories.find(c => c.id === expense.category_id)?.icon ?? '📦'}</Text>}
              label="Category"
              value={getCategoryName(expense.category_id)}
            />
            <DetailRow
              icon={<CreditCard {...{ size: 16, color: '#7c3aed' } as any} />}
              label="Payment Mode"
              value={getPaymentName(expense.payment_mode_id)}
            />
            {expense.note && (
              <DetailRow
                icon={<FileText {...{ size: 16, color: '#0891b2' } as any} />}
                label="Note"
                value={expense.note}
              />
            )}
            {expense.tags && (
              <DetailRow
                icon={<Tag {...{ size: 16, color: '#d97706' } as any} />}
                label="Tags"
                value={expense.tags}
              />
            )}
          </SectionCard>
        )}

        {/* ── EDIT mode: form fields ── */}
        {isEdit && (
          <>
            {/* Date */}
            <SectionCard>
              <Label text="Date" required />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', padding: 14, borderRadius: 12,
                  fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a',
                }}
              />
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>e.g. {todayStr()}</Text>
            </SectionCard>

            {/* Category */}
            <SectionCard>
              <Label text="Category" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {parentCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                    style={{
                      paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20,
                      backgroundColor: categoryId === cat.id ? '#2563eb' : '#e2e8f0',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: categoryId === cat.id ? '#fff' : '#475569' }}>
                      {cat.icon} {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>

            {/* Payment Mode */}
            <SectionCard>
              <Label text="Payment Mode" />
              <ChipGroup
                options={paymentModes.map(p => ({ value: String(p.id) as any, label: p.name }))}
                selected={paymentModeId !== null ? String(paymentModeId) as any : null}
                onSelect={(v) => setPaymentModeId(Number(v))}
                activeColor="#2563eb"
              />
            </SectionCard>

            {/* Note */}
            <SectionCard>
              <Label text="Note" />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What was this for?"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#f8fafc', padding: 14, borderRadius: 12,
                  fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0',
                  color: '#0f172a', textAlignVertical: 'top', minHeight: 80,
                }}
              />
            </SectionCard>

            {/* Tags */}
            <SectionCard>
              <Label text="Tags (comma separated)" />
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="food, monthly, essential"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', padding: 14, borderRadius: 12,
                  fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a',
                }}
              />
            </SectionCard>
          </>
        )}

        {/* ── Meta info ── */}
        {!isEdit && (
          <View style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 12 }}>
            <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              ID #{expense.id}  •  Last updated {new Date(expense.updated_at).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
