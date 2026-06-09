import { View, Text, SafeAreaView } from 'react-native';

export default function AddRecurringScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Add Recurring</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', color: '#64748b' }}>
          Form for creating recurring expense templates. (Coming in next part)
        </Text>
      </View>
    </SafeAreaView>
  );
}
