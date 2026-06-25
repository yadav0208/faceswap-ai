import { Tabs } from 'expo-router';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';

function TabBarIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
      />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

// Floating + button in the center of the tab bar
function FloatingButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/create');
      }}
      style={styles.fabButton}
      activeOpacity={0.85}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={90}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(13,13,20,0.92)', borderTopWidth: 0 },
            ]}
          />
        ),
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: styles.label,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} />
          ),
        }}
      />
      {/* Spacer for FAB */}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => <FloatingButton />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'My Looks',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'images' : 'images-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 6,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: -2,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.purple,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: Colors.brand.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
