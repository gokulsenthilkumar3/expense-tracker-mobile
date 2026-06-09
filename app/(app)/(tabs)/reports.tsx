import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useExpenseStore } from '../../../src/store/expenseStore';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { Expense } from '../../../src/db/queries';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { utils as XLSXUtils, write as XLSXWrite } from 'xlsx';
import {
  FileText, Download, Filter, BarChart2,
  ChevronDown, ChevronUp, Calendar, Tag,
} from 'lucide-react-native';

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split('T')[0]; }
function firstOfMonth() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
}
function fmtINR(n: number) {
  return '\u20b9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Build category-wise breakdown
function buildBreakdown(expenses: Expense[], catMap: Record<number, string>) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const key = catMap[e.category_id ?? 0] ?? 'Uncategorized';
    map[key] = (map[key] ?? 0) + e.amount;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => ({ name, total }));
}

// Build CSV string
function buildCSV(
  expenses: Expense[],
  catMap: Record<number, string>,
  pmMap: Record<number, string>,
): string {
  const header = ['ID', 'Date', 'Amount', 'Category', 'Payment Mode', 'Note', 'Tags'].join(',');
  const rows = expenses.map(e => [
    e.id,
    e.date,
    e.amount.toFixed(2),
    `"${catMap[e.category_id ?? 0] ?? 'Uncategorized'}"`,
    `"${pmMap[e.payment_mode_id ?? 0] ?? ''}"`,
    `"${(e.note ?? '').replace(/"/g, "'")}"`,
    `"${(e.tags ?? '').replace(/"/g, "'")}"`,
  ].join(','));
  return [header, ...rows].join('\n');
}

// Build HTML for PDF
function buildHTML(
  expenses: Expense[],
  catMap: Record<number, string>,
  pmMap: Record<number, string>,
  fromDate: string,
  toDate: string,
  breakdown: { name: string; total: number }[],
): string {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const rows = expenses.map(e => `
    <tr>
      <td>${e.date}</td>
      <td>${catMap[e.category_id ?? 0] ?? 'Uncategorized'}</td>
      <td>${pmMap[e.payment_mode_id ?? 0] ?? '—'}</td>
      <td>${e.note ?? '—'}</td>
      <td class="amount">${fmtINR(e.amount)}</td>
    </tr>`).join('');

  const breakdownRows = breakdown.map(b => {
    const pct = total > 0 ? ((b.total / total) * 100).toFixed(1) : '0';
    return `<tr><td>${b.name}</td><td class="amount">${fmtINR(b.total)}</td><td>${pct}%</td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1e293b; }
  h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 32px; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; }
  .kpi { flex: 1; background: #f8fafc; border-radius: 12px; padding: 16px; }
  .kpi-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-value { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px; }
  h2 { font-size: 16px; font-weight: 700; color: #334155; margin: 24px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1e293b; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
  td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #f8fafc; }
  .amount { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .total-row td { font-weight: 700; background: #eff6ff !important; color: #1d4ed8; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <h1>Expense Report</h1>
  <p class="subtitle">Period: ${fmtDate(fromDate)} – ${fmtDate(toDate)} &nbsp;•&nbsp; Generated on ${fmtDate(todayStr())}</p>

  <div class="summary">
    <div class="kpi"><div class="kpi-label">Total Spent</div><div class="kpi-value">${fmtINR(total)}</div></div>
    <div class="kpi"><div class="kpi-label">Transactions</div><div class="kpi-value">${expenses.length}</div></div>
    <div class="kpi"><div class="kpi-label">Avg per Entry</div><div class="kpi-value">${expenses.length > 0 ? fmtINR(total / expenses.length) : '₹0'}</div></div>
  </div>

  <h2>Category Breakdown</h2>
  <table>
    <thead><tr><th>Category</th><th class="amount">Total</th><th>Share</th></tr></thead>
    <tbody>${breakdownRows}</tbody>
    <tr class="total-row"><td><strong>Total</strong></td><td class="amount">${fmtINR(total)}</td><td>100%</td></tr>
  </table>

  <h2>All Transactions (${expenses.length})</h2>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Payment</th><th>Note</th><th class="amount">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tr class="total-row"><td colspan="4"><strong>Total</strong></td><td class="amount">${fmtINR(total)}</td></tr>
  </table>

  <div class="footer">Expense Tracker • Offline Report • No cloud data</div>
</body>
</html>`;
}

// ─── preset periods ───────────────────────────────────────────────────────────

type Preset = 'this-month' | 'last-month' | 'this-year' | 'all' | 'custom';

function getPresetDates(p: Preset): { from: string; to: string } {
  const now = new Date();
  switch (p) {
    case 'this-month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }
    case 'last-month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to   = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }
    case 'this-year': {
      return {
        from: `${now.getFullYear()}-01-01`,
        to:   `${now.getFullYear()}-12-31`,
      };
    }
    case 'all':
    default:
      return { from: '2000-01-01', to: '2099-12-31' };
  }
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-year',  label: 'This Year'  },
  { value: 'all',        label: 'All Time'   },
  { value: 'custom',     label: 'Custom'     },
];

// ─── main component ───────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const { expenses, recurringTemplates, fetchData } = useExpenseStore();
  const { categories, paymentModes, fetchData: fetchCats } = useCategoryStore();

  // ── filter state
  const [preset,     setPreset]     = useState<Preset>('this-month');
  const [fromDate,   setFromDate]   = useState(firstOfMonth());
  const [toDate,     setToDate]     = useState(todayStr());
  const [catFilter,  setCatFilter]  = useState<number | null>(null);
  const [pmFilter,   setPmFilter]   = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // ── export loading
  const [exportingPDF,  setExportingPDF]  = useState(false);
  const [exportingCSV,  setExportingCSV]  = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);

  useEffect(() => { fetchData(); fetchCats(); }, []);

  // Apply preset
  useEffect(() => {
    if (preset !== 'custom') {
      const { from, to } = getPresetDates(preset);
      setFromDate(from); setToDate(to);
    }
  }, [preset]);

  // Build lookup maps
  const catMap = useMemo(() => {
    const m: Record<number, string> = {};
    categories.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const pmMap = useMemo(() => {
    const m: Record<number, string> = {};
    paymentModes.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [paymentModes]);

  // Filtered expenses
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (e.date < fromDate || e.date > toDate) return false;
      if (catFilter !== null && e.category_id !== catFilter) return false;
      if (pmFilter  !== null && e.payment_mode_id !== pmFilter) return false;
      return true;
    });
  }, [expenses, fromDate, toDate, catFilter, pmFilter]);

  const total     = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);
  const breakdown = useMemo(() => buildBreakdown(filtered, catMap), [filtered, catMap]);
  const avgPerDay = useMemo(() => {
    if (filtered.length === 0) return 0;
    const days = Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000));
    return total / days;
  }, [filtered, total, fromDate, toDate]);

  // ── EXPORT: PDF
  const exportPDF = async () => {
    if (filtered.length === 0) { Alert.alert('No Data', 'No expenses in the selected range.'); return; }
    setExportingPDF(true);
    try {
      const html  = buildHTML(filtered, catMap, pmMap, fromDate, toDate, breakdown);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const dest = FileSystem.documentDirectory + `expense-report-${fromDate}-${toDate}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: dest });
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Share Expense Report PDF' });
    } catch (e: any) {
      Alert.alert('Export Failed', e.message ?? 'Could not export PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  // ── EXPORT: CSV
  const exportCSV = async () => {
    if (filtered.length === 0) { Alert.alert('No Data', 'No expenses in the selected range.'); return; }
    setExportingCSV(true);
    try {
      const csv  = buildCSV(filtered, catMap, pmMap);
      const path = FileSystem.documentDirectory + `expense-report-${fromDate}-${toDate}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Share Expense Report CSV' });
    } catch (e: any) {
      Alert.alert('Export Failed', e.message ?? 'Could not export CSV.');
    } finally {
      setExportingCSV(false);
    }
  };

  // ── EXPORT: XLSX
  const exportXLSX = async () => {
    if (filtered.length === 0) { Alert.alert('No Data', 'No expenses in the selected range.'); return; }
    setExportingXLSX(true);
    try {
      // Sheet 1: Transactions
      const txRows = filtered.map(e => ({
        ID:           e.id,
        Date:         e.date,
        Amount:       e.amount,
        Category:     catMap[e.category_id ?? 0] ?? 'Uncategorized',
        'Payment Mode': pmMap[e.payment_mode_id ?? 0] ?? '',
        Note:         e.note ?? '',
        Tags:         e.tags ?? '',
      }));
      // Sheet 2: Breakdown
      const bdRows = breakdown.map(b => ({
        Category: b.name,
        Total:    parseFloat(b.total.toFixed(2)),
        'Share %': total > 0 ? parseFloat(((b.total / total) * 100).toFixed(1)) : 0,
      }));

      const wb   = XLSXUtils.book_new();
      const ws1  = XLSXUtils.json_to_sheet(txRows);
      const ws2  = XLSXUtils.json_to_sheet(bdRows);
      XLSXUtils.book_append_sheet(wb, ws1, 'Transactions');
      XLSXUtils.book_append_sheet(wb, ws2, 'Breakdown');

      const wbout  = XLSXWrite(wb, { type: 'base64', bookType: 'xlsx' });
      const path   = FileSystem.documentDirectory + `expense-report-${fromDate}-${toDate}.xlsx`;
      await FileSystem.writeAsStringAsync(path, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(path, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Share Expense Report XLSX',
      });
    } catch (e: any) {
      Alert.alert('Export Failed', e.message ?? 'Could not export XLSX.');
    } finally {
      setExportingXLSX(false);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Period Presets ── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PRESETS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPreset(p.value)}
                  style={{
                    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20,
                    backgroundColor: preset === p.value ? '#2563eb' : '#e2e8f0',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: preset === p.value ? '#fff' : '#475569' }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Custom date range ── */}
        {preset === 'custom' && (
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
            marginBottom: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
            flexDirection: 'row', gap: 12,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 6 }}>FROM</Text>
              <TextInput
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', padding: 12, borderRadius: 10,
                  fontSize: 14, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a',
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 6 }}>TO</Text>
              <TextInput
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#f8fafc', padding: 12, borderRadius: 10,
                  fontSize: 14, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a',
                }}
              />
            </View>
          </View>
        )}

        {/* ── Filters toggle ── */}
        <TouchableOpacity
          onPress={() => setShowFilter(f => !f)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 4,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Filter {...{ size: 16, color: '#2563eb' } as any} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Filters</Text>
            {(catFilter !== null || pmFilter !== null) && (
              <View style={{ backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, color: '#fff', fontWeight: '700' }}>
                  {[catFilter, pmFilter].filter(Boolean).length}
                </Text>
              </View>
            )}
          </View>
          {showFilter
            ? <ChevronUp {...{ size: 16, color: '#64748b' } as any} />
            : <ChevronDown {...{ size: 16, color: '#64748b' } as any} />}
        </TouchableOpacity>

        {showFilter && (
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
            marginBottom: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
          }}>
            {/* Category filter */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setCatFilter(null)}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: catFilter === null ? '#2563eb' : '#e2e8f0' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: catFilter === null ? '#fff' : '#475569' }}>All</Text>
                </TouchableOpacity>
                {parentCategories.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCatFilter(c.id === catFilter ? null : c.id)}
                    style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: catFilter === c.id ? '#2563eb' : '#e2e8f0' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: catFilter === c.id ? '#fff' : '#475569' }}>
                      {c.icon} {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Payment Mode filter */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Payment Mode</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setPmFilter(null)}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: pmFilter === null ? '#7c3aed' : '#e2e8f0' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: pmFilter === null ? '#fff' : '#475569' }}>All</Text>
                </TouchableOpacity>
                {paymentModes.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPmFilter(p.id === pmFilter ? null : p.id)}
                    style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: pmFilter === p.id ? '#7c3aed' : '#e2e8f0' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: pmFilter === p.id ? '#fff' : '#475569' }}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── KPI cards ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 16 }}>
          {[
            { label: 'Total Spent',   value: fmtINR(total),                   color: '#ef4444', bg: '#fef2f2' },
            { label: 'Transactions',  value: String(filtered.length),          color: '#2563eb', bg: '#eff6ff' },
            { label: 'Avg / Day',     value: fmtINR(avgPerDay),               color: '#7c3aed', bg: '#f5f3ff' },
          ].map(k => (
            <View key={k.label} style={{
              flex: 1, backgroundColor: k.bg, borderRadius: 14, padding: 14,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: k.color }}>{k.value}</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' }}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Category Breakdown ── */}
        {breakdown.length > 0 && (
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Category Breakdown</Text>
            {breakdown.map((b, i) => {
              const pct = total > 0 ? (b.total / total) * 100 : 0;
              const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#ef4444','#ec4899'];
              const col = colors[i % colors.length];
              return (
                <View key={b.name} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b' }}>{b.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={{ fontSize: 13, color: '#64748b' }}>{pct.toFixed(1)}%</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', minWidth: 80, textAlign: 'right' }}>{fmtINR(b.total)}</Text>
                    </View>
                  </View>
                  <View style={{ height: 7, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
                    <View style={{ width: `${pct}%`, height: 7, backgroundColor: col, borderRadius: 4 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Transaction preview (last 10) ── */}
        <View style={{
          backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 20,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>Transactions</Text>
            <Text style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} entries</Text>
          </View>

          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Text style={{ fontSize: 32 }}>📊</Text>
              <Text style={{ color: '#64748b', fontSize: 15, marginTop: 12, fontWeight: '500' }}>No expenses found</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Try changing the date range or filters.</Text>
            </View>
          )}

          {filtered.slice(0, 10).map((e, idx) => (
            <View key={e.id} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 11,
              borderBottomWidth: idx < Math.min(filtered.length, 10) - 1 ? 1 : 0,
              borderBottomColor: '#f1f5f9',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b' }} numberOfLines={1}>
                  {e.note || catMap[e.category_id ?? 0] || 'Expense'}
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {e.date} · {catMap[e.category_id ?? 0] ?? 'Uncategorized'}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ef4444', marginLeft: 12 }}>
                -{fmtINR(e.amount)}
              </Text>
            </View>
          ))}

          {filtered.length > 10 && (
            <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 12 }}>
              + {filtered.length - 10} more entries in the export
            </Text>
          )}
        </View>

        {/* ── Export buttons ── */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Export Report</Text>
        <View style={{ gap: 12 }}>

          {/* PDF */}
          <TouchableOpacity
            onPress={exportPDF}
            disabled={exportingPDF}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: exportingPDF ? '#fca5a5' : '#ef4444',
              paddingVertical: 16, borderRadius: 14,
              shadowColor: '#ef4444', shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
            }}
          >
            {exportingPDF
              ? <ActivityIndicator color="#fff" size="small" />
              : <FileText {...{ size: 20, color: '#fff' } as any} />}
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {exportingPDF ? 'Generating PDF…' : 'Export as PDF'}
            </Text>
          </TouchableOpacity>

          {/* CSV */}
          <TouchableOpacity
            onPress={exportCSV}
            disabled={exportingCSV}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: exportingCSV ? '#86efac' : '#16a34a',
              paddingVertical: 16, borderRadius: 14,
              shadowColor: '#16a34a', shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
            }}
          >
            {exportingCSV
              ? <ActivityIndicator color="#fff" size="small" />
              : <Download {...{ size: 20, color: '#fff' } as any} />}
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {exportingCSV ? 'Generating CSV…' : 'Export as CSV'}
            </Text>
          </TouchableOpacity>

          {/* XLSX */}
          <TouchableOpacity
            onPress={exportXLSX}
            disabled={exportingXLSX}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: exportingXLSX ? '#a5b4fc' : '#2563eb',
              paddingVertical: 16, borderRadius: 14,
              shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
            }}
          >
            {exportingXLSX
              ? <ActivityIndicator color="#fff" size="small" />
              : <BarChart2 {...{ size: 20, color: '#fff' } as any} />}
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {exportingXLSX ? 'Generating Excel…' : 'Export as Excel (XLSX)'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
