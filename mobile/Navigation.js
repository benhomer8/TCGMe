import React, { useState, Component } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './HomeScreen';
import CollectionScreen from './CollectionScreen';
import { LoadingContext } from './LoadingContext';
import NavIcon from './NavIcon';

const Tab = createBottomTabNavigator();

export default function Navigation() {
  const { isLoading } = React.useContext(LoadingContext);
  const [playPackAnim, setPlayPackAnim] = useState(false);
  const [shouldResetPack, setShouldResetPack] = useState(false);
  const [playCollectionAnim, setPlayCollectionAnim] = useState(false);
  const [shouldResetCollection, setShouldResetCollection] = useState(false);

 
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false,
        tabBarStyle: {
          height: "8%",
          backgroundColor: 'white',
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
              <NavIcon shouldPlay={playPackAnim} shouldReset={shouldResetPack} source={require('./assets/lottie_animations/packIcon.json')} height= {'200%'} width={'200%'} />
            ),
          }}
          listeners={{
            tabPress: () => {
              // Play the animation
              setShouldResetPack(false); // cancel any reset
              setPlayPackAnim(false); // reset trigger
              setTimeout(() => setPlayPackAnim(true), 50);
            },
            blur: () => {
              // Reset when navigating away
              setPlayPackAnim(false);
              setShouldResetPack(true); // trigger reset
            },
          }}
        />

        <Tab.Screen
          name="Collection"
          component={CollectionScreen}
          options={{
            tabBarIcon: () => (
              <NavIcon shouldPlay={playCollectionAnim} shouldReset={shouldResetCollection} source={require('./assets/lottie_animations/collectionIcon.json')} height= {'280%'} width={'280%'} />
            ),
          }}
          listeners={{
            tabPress: e => {
              if (isLoading) {
                e.preventDefault();
                Alert.alert('Please wait', 'Your pack is still opening!');
              }
              else{
              // Play the animation
              setShouldResetCollection(false); // cancel any reset
              setPlayCollectionAnim(false); // reset trigger
              setTimeout(() => setPlayCollectionAnim(true), 50);
              }
            },
            blur: () => {
              // Reset when navigating away
              setPlayCollectionAnim(false);
              setShouldResetCollection(true); // trigger reset
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
