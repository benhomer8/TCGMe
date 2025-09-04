
import 'react-native-gesture-handler'; // <-- Must come first
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState } from 'react';
import Navigation from './Navigation';
import  { LoadingContext }  from './LoadingContext';
import { useFonts } from 'expo-font';

//renders the app
export default function App() {
  const [fontsLoaded] = useFonts({
    'CaptionFont': require('./assets/Fonts/CaptionFont.otf'),
    'CardNameFont': require('./assets/Fonts/CardNameFont.ttf'),
  });
  const [isLoading, setLoading] = useState(false);


   return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingContext.Provider value={{ isLoading, setLoading }}>
        <Navigation />
      </LoadingContext.Provider>
    </GestureHandlerRootView>
  );
}
