
import 'react-native-gesture-handler'; // <-- Must come first
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState } from 'react';
import Navigation from './Navigation';
import  { LoadingContext }  from './LoadingContext';

//renders the app
export default function App() {
  
  const [isLoading, setLoading] = useState(false);


   return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingContext.Provider value={{ isLoading, setLoading }}>
        <Navigation />
      </LoadingContext.Provider>
    </GestureHandlerRootView>
  );
}
