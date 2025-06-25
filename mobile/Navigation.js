import React, { useState } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './HomeScreen';
import CollectionScreen from './CollectionScreen';
import { LoadingContext } from './LoadingContext';
import PackIcon from './PackIcon';

const Tab = createBottomTabNavigator();

export default function Navigation() {
  const { isLoading } = React.useContext(LoadingContext);
  const [playPackAnim, setPlayPackAnim] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false,
        tabBarStyle: {
          height: "8%",
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          paddingBottom: 0,
          paddingTop: '5%',
        },
      }}>

        <Tab.Screen
          name="Open"
          component={HomeScreen}
          options={{
            tabBarIcon: () => (
              <PackIcon shouldPlay={playPackAnim} shouldReset={shouldReset} />
            ),
          }}
          listeners={{
            tabPress: () => {
              // Play the animation
              setShouldReset(false); // cancel any reset
              setPlayPackAnim(false); // reset trigger
              setTimeout(() => setPlayPackAnim(true), 50);
            },
            blur: () => {
              // Reset when navigating away
              setPlayPackAnim(false);
              setShouldReset(true); // trigger reset
            },
          }}
        />

        <Tab.Screen
          name="Collection"
          component={CollectionScreen}
          listeners={{
            tabPress: e => {
              if (isLoading) {
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
