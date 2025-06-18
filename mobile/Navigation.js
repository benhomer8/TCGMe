import React, { useContext } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './HomeScreen';
import CollectionScreen from './CollectionScreen';
import { LoadingContext } from './LoadingContext';

const Tab = createBottomTabNavigator();

export default function Navigation() {
  const { isLoading } = useContext(LoadingContext);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Open" component={HomeScreen} />

        <Tab.Screen
          name="Collection"
          component={CollectionScreen}
          listeners={{
            tabPress: e => {
              if (isLoading) {
                // Prevent default action
                e.preventDefault();
                Alert.alert('Please wait', 'Your pack is still opening!');
              }
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
