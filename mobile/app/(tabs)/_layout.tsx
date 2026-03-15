import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MiniPlayer from '../../components/MiniPlayer';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      {focused && (
        <LinearGradient
          colors={['rgba(167,139,250,0.25)', 'rgba(125,211,252,0.15)']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'rgba(250,251,255,0.95)',
            borderTopColor: 'rgba(167,139,250,0.2)',
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: {
            fontSize: 11, fontWeight: '700', letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} /> }} />
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
      </Tabs>

      {/* MiniPlayer sits above tab bar */}
      <MiniPlayer onPress={() => console.log('Open full player')} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40, height: 28,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, overflow: 'hidden',
  },
  iconActive: { borderRadius: 10 },
});
