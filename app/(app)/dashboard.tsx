import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function Dashboard() {
  const { logout } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Dashboard</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
          Welcome to the Expense Tracker! (Placeholder for Phase 2)
        </Text>
        
        <TouchableOpacity 
          onPress={logout}
          style={{
            backgroundColor: '#ef4444',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Lock App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
