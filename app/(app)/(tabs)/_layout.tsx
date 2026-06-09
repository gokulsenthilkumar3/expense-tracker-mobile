import { Tabs } from 'expo-router';
import { Home, Receipt } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: true,
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#64748b'
    }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home {...{ color, size } as any} />
        }} 
      />
      <Tabs.Screen 
        name="expenses" 
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => <Receipt {...{ color, size } as any} />
        }} 
      />
    </Tabs>
  );
}
