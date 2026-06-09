import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useCategoryStore } from '../../../src/store/categoryStore';
import { useAuthStore } from '../../../src/store/authStore';
import {
  addCategory, deleteCategory,
  addPaymentMode, deletePaymentMode,
  getCategories, getPaymentModes,
} from '../../../src/db/queries';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  Tag, CreditCard, Shield, Download, Upload,
  Info, ChevronRight, Trash2, Plus, X, Check,
  Eye, EyeOff, LogOut,
} from 'lucide-react-native';

// ─── helpers ─────────────────────────────────────────────────────────────────

const EMOJI_PRESETS = [
  '🏠','🍔','🚗','💊','🎓','🛍','💡','📱','✈️','🎮',
  '💰','🏋️','👗','🐾','🎁','📚','☕','🎵','🏥','🔧',
  '💈','🌿','🧴','🎯','📦','🏦','🚌','🍕','🎬','💻',
];

const COLOR_PRESETS = [
  '#ef4444','#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#8b5cf6','#ec4899','#64748b','#0ea5e9',
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: 12, fontWeight: '700', color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: 0.7,
      marginTop: 28, marginBottom: 10,
    }}>{title}</Text>
  );
}

function SettingsRow({
  icon, label, value, onPress, danger, rightElement,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 15, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
      }}
    >
      <View style={{ width: 32 }}>{icon}</View>
      <Text style={{
        flex: 1, fontSize: 15, fontWeight: '500',
        color: danger ? '#ef4444' : '#1e293b',
      }}>{label}</Text>
      {value && <Text style={{ fontSize: 14, color: '#94a3b8', marginRight: 6 }}>{value}</Text>}
      {rightElement ?? (onPress && <ChevronRight {...{ size: 16, color: '#cbd5e1' } as any} />)}
    </TouchableOpacity>
  );
}

// ─── ADD ITEM modal ───────────────────────────────────────────────────────────

function AddItemModal({
  visible, title, onClose, onAdd, withIcon = false,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onAdd: (name: string, icon?: string, color?: string) => Promise<void>;
  withIcon?: boolean;
}) {
  const [name,    setName]    = useState('');
  const [icon,    setIcon]    = useState('🏷️');
  const [color,   setColor]   = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(''); setIcon('🏷️'); setColor('#3b82f6'); };

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a name.'); return; }
    setLoading(true);
    try {
      await onAdd(name.trim(), withIcon ? icon : undefined, withIcon ? color : undefined);
      reset(); onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not add item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{
          backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 24, paddingBottom: 36,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{title}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <X {...{ size: 22, color: '#64748b' } as any} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 }}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Entertainment"
            placeholderTextColor="#94a3b8"
            style={{
              backgroundColor: '#f8fafc', padding: 14, borderRadius: 12,
              fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0',
              color: '#0f172a', marginBottom: 16,
            }}
          />

          {withIcon && (
            <>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 }}>ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {EMOJI_PRESETS.map(e => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setIcon(e)}
                      style={{
                        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: icon === e ? '#eff6ff' : '#f8fafc',
                        borderWidth: icon === e ? 2 : 1, borderColor: icon === e ? '#2563eb' : '#e2e8f0',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 }}>COLOR</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {COLOR_PRESETS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: c,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: color === c ? 3 : 0, borderColor: '#fff',
                      shadowColor: color === c ? c : 'transparent',
                      shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6,
                    }}
                  >
                    {color === c && <Check {...{ size: 16, color: '#fff' } as any} />}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#bfdbfe' : '#2563eb',
              paddingVertical: 16, borderRadius: 14, alignItems: 'center',
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Add</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── CHANGE PIN modal ─────────────────────────────────────────────────────────

function ChangePINModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { setupPin, biometricEnabled } = useAuthStore();
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuthStore();

  const reset = () => { setCurrent(''); setNext(''); setConfirm(''); };

  const handleSave = async () => {
    if (next.length < 4) { Alert.alert('Too short', 'PIN must be at least 4 digits.'); return; }
    if (next !== confirm) { Alert.alert('Mismatch', 'New PINs do not match.'); return; }
    setLoading(true);
    try {
      const valid = await login(current);
      if (!valid) { Alert.alert('Wrong PIN', 'Current PIN is incorrect.'); setLoading(false); return; }
      await setupPin(next, '', '', biometricEnabled);
      Alert.alert('Success', 'PIN updated successfully.');
      reset(); onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not change PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{
          backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 24, paddingBottom: 40,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>Change PIN</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <X {...{ size: 22, color: '#64748b' } as any} />
            </TouchableOpacity>
          </View>

          {[
            { label: 'CURRENT PIN', val: current, set: setCurrent, show: showCur, toggle: () => setShowCur(v => !v) },
            { label: 'NEW PIN',     val: next,    set: setNext,    show: showNew, toggle: () => setShowNew(v => !v) },
            { label: 'CONFIRM NEW PIN', val: confirm, set: setConfirm, show: showNew, toggle: () => setShowNew(v => !v) },
          ].map(f => (
            <View key={f.label} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#f8fafc', borderRadius: 12,
                borderWidth: 1, borderColor: '#e2e8f0',
                paddingHorizontal: 14,
              }}>
                <TextInput
                  value={f.val}
                  onChangeText={f.set}
                  secureTextEntry={!f.show}
                  keyboardType="numeric"
                  maxLength={8}
                  placeholder="••••"
                  placeholderTextColor="#94a3b8"
                  style={{ flex: 1, paddingVertical: 14, fontSize: 18, color: '#0f172a', letterSpacing: 4 }}
                />
                <TouchableOpacity onPress={f.toggle}>
                  {f.show
                    ? <EyeOff {...{ size: 18, color: '#94a3b8' } as any} />
                    : <Eye   {...{ size: 18, color: '#94a3b8' } as any} />}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#bfdbfe' : '#2563eb',
              paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Update PIN</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SETTINGS SCREEN ────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { categories, paymentModes, fetchData } = useCategoryStore();
  const { biometricEnabled, logout, setupPin, hasPinSetup } = useAuthStore();

  const [showAddCat,  setShowAddCat]  = useState(false);
  const [showAddPM,   setShowAddPM]   = useState(false);
  const [showPIN,     setShowPIN]     = useState(false);
  const [bioEnabled,  setBioEnabled]  = useState(biometricEnabled);
  const [backingUp,   setBackingUp]   = useState(false);
  const [restoring,   setRestoring]   = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setBioEnabled(biometricEnabled); }, [biometricEnabled]);

  const parentCategories = categories.filter(c => !c.parent_id);

  // ── add category
  const handleAddCategory = async (name: string, icon?: string, color?: string) => {
    await addCategory(name, icon ?? null, color ?? null, null);
    await fetchData();
  };

  // ── delete category
  const handleDeleteCategory = (id: number, name: string) => {
    Alert.alert(
      'Delete Category',
      `Remove "${name}"? This won't delete existing expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try { await deleteCategory(id); await fetchData(); }
            catch (e: any) { Alert.alert('Error', e.message); }
          },
        },
      ]
    );
  };

  // ── add payment mode
  const handleAddPaymentMode = async (name: string) => {
    await addPaymentMode(name);
    await fetchData();
  };

  // ── delete payment mode
  const handleDeletePaymentMode = (id: number, name: string) => {
    Alert.alert(
      'Delete Payment Mode',
      `Remove "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try { await deletePaymentMode(id); await fetchData(); }
            catch (e: any) { Alert.alert('Error', e.message); }
          },
        },
      ]
    );
  };

  // ── biometric toggle
  const handleBioToggle = async (val: boolean) => {
    setBioEnabled(val);
    try {
      await setupPin('', '', '', val); // persists biometric preference only
    } catch (e) { /* ignore pin-empty error */ }
  };

  // ── backup
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const [cats, pms] = await Promise.all([getCategories(), getPaymentModes()]);
      const payload = JSON.stringify({ categories: cats, paymentModes: pms, exportedAt: new Date().toISOString() }, null, 2);
      const path = FileSystem.documentDirectory + `expense-backup-${new Date().toISOString().split('T')[0]}.json`;
      await FileSystem.writeAsStringAsync(path, payload, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save Backup File' });
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message ?? 'Could not create backup.');
    } finally {
      setBackingUp(false);
    }
  };

  // ── restore
  const handleRestore = async () => {
    Alert.alert(
      'Restore Settings',
      'This will import categories and payment modes from a backup file. Existing ones are not removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pick File', onPress: async () => {
            setRestoring(true);
            try {
              const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
              if (result.canceled || !result.assets?.[0]) { setRestoring(false); return; }
              const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
              const data = JSON.parse(content);
              let imported = 0;
              for (const c of (data.categories ?? [])) {
                if (c.is_system) continue;
                try { await addCategory(c.name, c.icon, c.color, null); imported++; } catch { /* skip dupe */ }
              }
              for (const p of (data.paymentModes ?? [])) {
                if (p.is_system) continue;
                try { await addPaymentMode(p.name); imported++; } catch { /* skip dupe */ }
              }
              await fetchData();
              Alert.alert('Restored', `Imported ${imported} items from backup.`);
            } catch (e: any) {
              Alert.alert('Restore Failed', e.message ?? 'Invalid backup file.');
            } finally {
              setRestoring(false);
            }
          },
        },
      ]
    );
  };

  // ── logout
  const handleLogout = () => {
    Alert.alert(
      'Lock App',
      'This will lock the app and return to the PIN screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Lock', style: 'destructive', onPress: logout },
      ]
    );
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Categories ── */}
        <SectionHeader title="Categories" />
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}>
          {parentCategories.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>No custom categories yet</Text>
            </View>
          )}
          {parentCategories.map((cat) => (
            <View key={cat.id} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 13, paddingHorizontal: 16,
              borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: cat.color ? cat.color + '22' : '#eff6ff',
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Text style={{ fontSize: 18 }}>{cat.icon ?? '🏷️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#1e293b' }}>{cat.name}</Text>
                {cat.is_system === 1 && (
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>System</Text>
                )}
              </View>
              {cat.is_system === 0 && (
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(cat.id, cat.name)}
                  style={{ padding: 8 }}
                >
                  <Trash2 {...{ size: 16, color: '#ef4444' } as any} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setShowAddCat(true)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14,
              backgroundColor: '#f8fafc',
            }}
          >
            <Plus {...{ size: 16, color: '#2563eb' } as any} />
            <Text style={{ color: '#2563eb', fontWeight: '600', fontSize: 14 }}>Add Category</Text>
          </TouchableOpacity>
        </View>

        {/* ── Payment Modes ── */}
        <SectionHeader title="Payment Modes" />
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}>
          {paymentModes.map((pm) => (
            <View key={pm.id} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 13, paddingHorizontal: 16,
              borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <CreditCard {...{ size: 18, color: '#16a34a' } as any} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b' }}>{pm.name}</Text>
              {pm.is_system === 0 && (
                <TouchableOpacity
                  onPress={() => handleDeletePaymentMode(pm.id, pm.name)}
                  style={{ padding: 8 }}
                >
                  <Trash2 {...{ size: 16, color: '#ef4444' } as any} />
                </TouchableOpacity>
              )}
              {pm.is_system === 1 && (
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>System</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setShowAddPM(true)}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14,
              backgroundColor: '#f8fafc',
            }}
          >
            <Plus {...{ size: 16, color: '#16a34a' } as any} />
            <Text style={{ color: '#16a34a', fontWeight: '600', fontSize: 14 }}>Add Payment Mode</Text>
          </TouchableOpacity>
        </View>

        {/* ── Security ── */}
        <SectionHeader title="Security" />
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}>
          <SettingsRow
            icon={<Shield {...{ size: 18, color: '#7c3aed' } as any} />}
            label="Change PIN"
            onPress={() => setShowPIN(true)}
          />
          <SettingsRow
            icon={<Eye {...{ size: 18, color: '#0891b2' } as any} />}
            label="Biometric Unlock"
            rightElement={
              <Switch
                value={bioEnabled}
                onValueChange={handleBioToggle}
                trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
                thumbColor={bioEnabled ? '#2563eb' : '#94a3b8'}
              />
            }
          />
          <SettingsRow
            icon={<LogOut {...{ size: 18, color: '#ef4444' } as any} />}
            label="Lock App"
            danger
            onPress={handleLogout}
          />
        </View>

        {/* ── Backup & Restore ── */}
        <SectionHeader title="Data" />
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}>
          <SettingsRow
            icon={backingUp
              ? <ActivityIndicator size="small" color="#2563eb" />
              : <Download {...{ size: 18, color: '#2563eb' } as any} />}
            label={backingUp ? 'Creating backup…' : 'Backup Settings'}
            value="JSON"
            onPress={backingUp ? undefined : handleBackup}
          />
          <SettingsRow
            icon={restoring
              ? <ActivityIndicator size="small" color="#7c3aed" />
              : <Upload {...{ size: 18, color: '#7c3aed' } as any} />}
            label={restoring ? 'Restoring…' : 'Restore Settings'}
            onPress={restoring ? undefined : handleRestore}
          />
        </View>

        {/* ── About ── */}
        <SectionHeader title="About" />
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}>
          <SettingsRow
            icon={<Info {...{ size: 18, color: '#64748b' } as any} />}
            label="App Version"
            value="1.0.0"
          />
          <SettingsRow
            icon={<Tag {...{ size: 18, color: '#64748b' } as any} />}
            label="Storage"
            value="Local only"
          />
          <SettingsRow
            icon={<Shield {...{ size: 18, color: '#64748b' } as any} />}
            label="Privacy"
            value="No cloud · No tracking"
          />
        </View>

      </ScrollView>

      {/* ── Modals ── */}
      <AddItemModal
        visible={showAddCat}
        title="New Category"
        onClose={() => setShowAddCat(false)}
        onAdd={handleAddCategory}
        withIcon
      />
      <AddItemModal
        visible={showAddPM}
        title="New Payment Mode"
        onClose={() => setShowAddPM(false)}
        onAdd={handleAddPaymentMode}
        withIcon={false}
      />
      <ChangePINModal
        visible={showPIN}
        onClose={() => setShowPIN(false)}
      />
    </SafeAreaView>
  );
}
