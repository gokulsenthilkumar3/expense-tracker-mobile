import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { useRouter } from 'expo-router';
import { ChevronDown, Info } from 'lucide-react-native';

// ─── types ───────────────────────────────────────────────────────────────────

type RecurringType = 'fixed' | 'installment' | 'variable';
type Frequency     = 'daily' | 'weekly' | 'monthly' | 'yearly';

const TYPE_OPTIONS: { value: RecurringType; label: string; desc: string; color: string }[] = [
  { value: 'fixed',       label: '📅 Fixed',       desc: 'Same amount every cycle',              color: '#2563eb' },
  { value: 'installment', label: '🏦 Installment',  desc: 'Loan / Chit Fund with fixed tenure',  color: '#7c3aed' },
  { value: 'variable',    label: '📊 Variable',     desc: 'Amount varies (WiFi, EB, etc.)',       color: '#0891b2' },
];

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function addFrequency(dateStr: string, freq: Frequency): string {
  const d = new Date(dateStr);
  switch (freq) {
    case 'daily':   d.setDate(d.getDate() + 1);         break;
    case 'weekly':  d.setDate(d.getDate() + 7);         break;
    case 'monthly': d.setMonth(d.getMonth() + 1);       break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

function computeEndDate(startDate: string, freq: Frequency, periods: number): string {
  let d = new Date(startDate);
  for (let i = 0; i < periods; i++) {
    switch (freq) {
      case 'daily':   d.setDate(d.getDate() + 1);         break;
      case 'weekly':  d.setDate(d.getDate() + 7);         break;
      case 'monthly': d.setMonth(d.getMonth() + 1);       break;
      case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
    }
  }
  return d.toISOString().split('T')[0];
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 }}>
      {text}{required && <Text style={{ color: '#dc2626' }}> *</Text>}
    </Text>
  );
}

function InputBox({
  value, onChangeText, placeholder, keyboardType = 'default', multiline = false,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={{
        backgroundColor: '#ffffff',
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#0f172a',
        textAlignVertical: multiline ? 'top' : 'center',
        minHeight: multiline ? 72 : undefined,
      }}
    />
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
            paddingVertical: 9,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: selected === o.value ? activeColor : '#e2e8f0',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: selected === o.value ? '#ffffff' : '#475569' }}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#ffffff',
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    }}>
      {children}
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 14, textTransform: 'uppercase' }}>
      {text}
    </Text>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
}

function Field({ style, children }: { style?: object; children: React.ReactNode }) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

function InfoNote({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 8, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 8 }}>
      <Info {...{ size: 14, color: '#0891b2' } as any} />
      <Text style={{ fontSize: 12, color: '#0369a1', flex: 1, lineHeight: 18 }}>{text}</Text>
    </View>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AddRecurringScreen() {
  const router = useRouter();
  const { addRecurringTemplate } = useExpenseStore();
  const { categories, paymentModes, fetchData } = useCategoryStore();

  useEffect(() => { fetchData(); }, []);

  // ── shared fields
  const [recurringType, setRecurringType] = useState<RecurringType>('fixed');
  const [name,          setName]          = useState('');
  const [categoryId,    setCategoryId]    = useState<number | null>(null);
  const [paymentModeId, setPaymentModeId] = useState<number | null>(null);
  const [frequency,     setFrequency]     = useState<Frequency>('monthly');
  const [startDate,     setStartDate]     = useState(todayStr());
  const [note,          setNote]          = useState('');

  // ── fixed fields
  const [fixedAmount, setFixedAmount] = useState('');

  // ── installment fields
  const [totalAmount,   setTotalAmount]   = useState('');
  const [tenure,        setTenure]        = useState('');
  const [installmentAmt,setInstallmentAmt]= useState('');
  const [autoCalcEmi,   setAutoCalcEmi]   = useState(true);

  // ── variable fields
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // ── reminder fields
  const [reminderOnDue,  setReminderOnDue]  = useState(true);
  const [reminderDays,   setReminderDays]   = useState('1');
  const [hasEndDate,     setHasEndDate]     = useState(false);
  const [endDate,        setEndDate]        = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculate EMI
  useEffect(() => {
    if (recurringType === 'installment' && autoCalcEmi) {
      const total = parseFloat(totalAmount);
      const t     = parseInt(tenure);
      if (!isNaN(total) && !isNaN(t) && t > 0) {
        setInstallmentAmt((total / t).toFixed(2));
      } else {
        setInstallmentAmt('');
      }
    }
  }, [totalAmount, tenure, autoCalcEmi, recurringType]);

  // Auto-compute end date for installments
  const computedEndDate = recurringType === 'installment' && tenure && startDate
    ? computeEndDate(startDate, frequency, parseInt(tenure) || 0)
    : null;

  // ── validation
  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.';
    if (!startDate)   return 'Start date is required.';
    if (recurringType === 'fixed') {
      if (!fixedAmount || isNaN(Number(fixedAmount)) || Number(fixedAmount) <= 0)
        return 'Enter a valid amount.';
    }
    if (recurringType === 'installment') {
      if (!tenure || isNaN(parseInt(tenure)) || parseInt(tenure) <= 0)
        return 'Enter a valid tenure (number of installments).';
      if (!installmentAmt || isNaN(Number(installmentAmt)) || Number(installmentAmt) <= 0)
        return 'Enter a valid installment amount.';
    }
    if (recurringType === 'variable') {
      const mn = Number(minAmount), mx = Number(maxAmount);
      if (isNaN(mn) || mn < 0) return 'Enter a valid min amount.';
      if (isNaN(mx) || mx <= 0) return 'Enter a valid max amount.';
      if (mn > mx) return 'Min amount cannot exceed max amount.';
    }
    if (hasEndDate && endDate && endDate < startDate)
      return 'End date cannot be before start date.';
    return null;
  };

  // ── save
  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }

    setIsSaving(true);
    try {
      const nextDue = addFrequency(startDate, frequency);

      await addRecurringTemplate({
        name:            name.trim(),
        type:            recurringType,
        category_id:     categoryId,
        payment_mode_id: paymentModeId,
        amount:          recurringType === 'fixed' ? Number(fixedAmount) : null,
        total_periods:   recurringType === 'installment' ? parseInt(tenure) : null,
        installment_amt: recurringType === 'installment' ? Number(installmentAmt) : null,
        min_amount:      recurringType === 'variable' ? Number(minAmount) : null,
        max_amount:      recurringType === 'variable' ? Number(maxAmount) : null,
        frequency,
        start_date:      startDate,
        end_date:        recurringType === 'installment'
                           ? computedEndDate
                           : hasEndDate ? endDate : null,
        next_due_date:   nextDue,
        reminder_days:   parseInt(reminderDays) || 1,
        reminder_on_due: reminderOnDue ? 1 : 0,
        note: note.trim() || null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save recurring entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Type selector ── */}
        <SectionCard>
          <SectionTitle text="Recurring Type" />
          {TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setRecurringType(opt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 2,
                borderColor: recurringType === opt.value ? opt.color : '#e2e8f0',
                backgroundColor: recurringType === opt.value ? opt.color + '10' : '#f8fafc',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: recurringType === opt.value ? opt.color : '#334155' }}>
                  {opt.label}
                </Text>
                <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{opt.desc}</Text>
              </View>
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                borderWidth: 2,
                borderColor: recurringType === opt.value ? opt.color : '#cbd5e1',
                backgroundColor: recurringType === opt.value ? opt.color : 'transparent',
                justifyContent: 'center', alignItems: 'center',
              }}>
                {recurringType === opt.value && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' }} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </SectionCard>

        {/* ── Basic info ── */}
        <SectionCard>
          <SectionTitle text="Basic Info" />
          <Label text="Name" required />
          <InputBox value={name} onChangeText={setName} placeholder="e.g. Home Loan EMI, EB Bill" />

          <View style={{ height: 16 }} />
          <Label text="Start Date" required />
          <InputBox
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Format: YYYY-MM-DD  (e.g. {todayStr()})</Text>

          <View style={{ height: 16 }} />
          <Label text="Billing Frequency" required />
          <ChipGroup
            options={FREQ_OPTIONS}
            selected={frequency}
            onSelect={setFrequency}
            activeColor="#2563eb"
          />
        </SectionCard>

        {/* ── Amount section (conditional) ── */}
        <SectionCard>
          <SectionTitle text="Amount" />

          {/* FIXED */}
          {recurringType === 'fixed' && (
            <>
              <Label text="Amount (₹)" required />
              <InputBox value={fixedAmount} onChangeText={setFixedAmount} placeholder="0.00" keyboardType="decimal-pad" />
            </>
          )}

          {/* INSTALLMENT */}
          {recurringType === 'installment' && (
            <>
              <Row>
                <Field>
                  <Label text="Total Amount (₹)" />
                  <InputBox value={totalAmount} onChangeText={setTotalAmount} placeholder="e.g. 120000" keyboardType="decimal-pad" />
                </Field>
                <Field>
                  <Label text="Tenure" required />
                  <InputBox
                    value={tenure}
                    onChangeText={t => { setTenure(t); }}
                    placeholder={frequency === 'monthly' ? 'months' : 'periods'}
                    keyboardType="numeric"
                  />
                </Field>
              </Row>
              <View style={{ height: 14 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Label text={`Installment Amount (₹)`} required />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Auto-calc</Text>
                  <Switch
                    value={autoCalcEmi}
                    onValueChange={setAutoCalcEmi}
                    trackColor={{ true: '#7c3aed', false: '#e2e8f0' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
              <InputBox
                value={installmentAmt}
                onChangeText={setInstallmentAmt}
                placeholder="Per instalment amount"
                keyboardType="decimal-pad"
              />
              {computedEndDate && (
                <InfoNote text={`Based on tenure of ${tenure} × ${frequency}, the last payment falls on ${computedEndDate}.`} />
              )}
            </>
          )}

          {/* VARIABLE */}
          {recurringType === 'variable' && (
            <>
              <Row>
                <Field>
                  <Label text="Min Amount (₹)" />
                  <InputBox value={minAmount} onChangeText={setMinAmount} placeholder="e.g. 500" keyboardType="decimal-pad" />
                </Field>
                <Field>
                  <Label text="Max Amount (₹)" required />
                  <InputBox value={maxAmount} onChangeText={setMaxAmount} placeholder="e.g. 1500" keyboardType="decimal-pad" />
                </Field>
              </Row>
              <InfoNote text="When you mark as paid, enter the actual amount for that cycle." />
            </>
          )}
        </SectionCard>

        {/* ── Category & Payment Mode ── */}
        <SectionCard>
          <SectionTitle text="Category & Payment" />
          <Label text="Category" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {parentCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: categoryId === cat.id ? '#2563eb' : '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: categoryId === cat.id ? '#ffffff' : '#475569' }}>
                  {cat.icon} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="Payment Mode" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {paymentModes.map(pm => (
              <TouchableOpacity
                key={pm.id}
                onPress={() => setPaymentModeId(pm.id === paymentModeId ? null : pm.id)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: paymentModeId === pm.id ? '#2563eb' : '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: paymentModeId === pm.id ? '#ffffff' : '#475569' }}>
                  {pm.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ── End Date (fixed & variable only) ── */}
        {recurringType !== 'installment' && (
          <SectionCard>
            <SectionTitle text="End Date" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Set an end date?</Text>
                <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Leave off for open-ended bills</Text>
              </View>
              <Switch
                value={hasEndDate}
                onValueChange={setHasEndDate}
                trackColor={{ true: '#2563eb', false: '#e2e8f0' }}
                thumbColor="#ffffff"
              />
            </View>
            {hasEndDate && (
              <InputBox
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            )}
          </SectionCard>
        )}

        {/* ── Reminders ── */}
        <SectionCard>
          <SectionTitle text="Reminders" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Remind on due date</Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Local notification on the day</Text>
            </View>
            <Switch
              value={reminderOnDue}
              onValueChange={setReminderOnDue}
              trackColor={{ true: '#16a34a', false: '#e2e8f0' }}
              thumbColor="#ffffff"
            />
          </View>

          <Label text="Also remind N days before" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['0', '1', '2', '3', '5', '7'].map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setReminderDays(d)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: reminderDays === d ? '#16a34a' : '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: reminderDays === d ? '#ffffff' : '#475569' }}>
                  {d === '0' ? 'None' : `${d}d`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <InfoNote text="Reminders are stored locally and shown via device notifications. No internet required." />
        </SectionCard>

        {/* ── Notes ── */}
        <SectionCard>
          <SectionTitle text="Notes" />
          <Label text="Additional Notes (optional)" />
          <InputBox value={note} onChangeText={setNote} placeholder="Any extra details..." multiline />
        </SectionCard>

        {/* ── Save button ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            backgroundColor: isSaving ? '#93c5fd' : '#7c3aed',
            paddingVertical: 18,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            {isSaving ? 'Saving…' : '✓  Save Recurring Entry'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
