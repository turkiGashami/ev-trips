import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import AddTripScreen from '../screens/trips/AddTripScreen';
import MyTripsScreen from '../screens/trips/MyTripsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator();

function AddTripButton({ children, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.addButtonInner}>{children}</View>
    </TouchableOpacity>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { active: any; inactive: any }> = {
            Home: { active: 'home', inactive: 'home-outline' },
            Search: { active: 'search', inactive: 'search-outline' },
            AddTrip: { active: 'add', inactive: 'add' },
            MyTrips: { active: 'list', inactive: 'list-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'البحث' }} />
      <Tab.Screen
        name="AddTrip"
        component={AddTripScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <AddTripButton {...props} />,
        }}
      />
      <Tab.Screen name="MyTrips" component={MyTripsScreen} options={{ tabBarLabel: 'رحلاتي' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'حسابي' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  addButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
