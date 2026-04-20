import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/search/SearchScreen';
import TripDetailScreen from '../screens/trips/TripDetailScreen';

const Stack = createNativeStackNavigator();

export default function TripStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="SearchResults" component={SearchScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
    </Stack.Navigator>
  );
}
