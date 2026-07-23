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
import { Colors } from '../../constants/theme';

function TabBarIcon({
  name,
  focused,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.brand.gold : 'rgba(255,255,255,0.35)'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

// Gold floating + button in the center
function FloatingButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/create');
      }}
      style={styles.fabOuter}
      activeOpacity={0.85}
    >
      {/* Gold ring */}
      <View style={styles.fabRing}>
        <View style={styles.fabInner}>
          <Ionicons name="add" size={26} color="#fff" />
        </View>
      </View>
      <Text style={styles.fabLabel}>Create</Text>
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
            intensity={95}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(10,10,10,0.96)', borderTopWidth: 0 },
            ]}
          />
        ),
        tabBarShowLabel: false, // we render labels manually
        tabBarActiveTintColor: Colors.brand.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'sparkles' : 'sparkles-outline'}
              focused={focused}
              label="Studio"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'compass' : 'compass-outline'}
              focused={focused}
              label="Explore"
            />
          ),
        }}
      />
      {/* Floating Create button */}
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
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'archive' : 'archive-outline'}
              focused={focused}
              label="My Studio"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              label="Profile"
            />
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
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 26 : 6,
    paddingTop: 4,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 1,
  },
  tabLabelActive: {
    color: Colors.brand.gold,
    fontWeight: '700',
  },
  // Floating Create
  fabOuter: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    width: 70,
  },
  fabRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: Colors.brand.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  fabInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.gold,
    marginTop: 3,
  },
});
