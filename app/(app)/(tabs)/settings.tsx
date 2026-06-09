import { View, Text, SafeAreaView } from 'react-native';
import { Settings } from 'lucide-react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
      <Settings {...{ size: 48, color: '#cbd5e1' } as any} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 }}>Settings</Text>
      <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Coming in Step 5</Text>
    </SafeAreaView>
  );
}
