import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import ActiveJobsScreen from './src/screens/ActiveJobsScreen';
import MaterialsScreen from './src/screens/MaterialsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: '🏗️',
  'Active Jobs': '🦺',
  Materials: '🧱',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>{ICONS[route.name]}</Text>
          ),
          tabBarActiveTintColor: '#F5A623',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#1C1C1E',
            borderTopColor: '#2C2C2E',
            height: 70,
            paddingBottom: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Active Jobs" component={ActiveJobsScreen} />
        <Tab.Screen name="Materials" component={MaterialsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
