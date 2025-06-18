import React, { useState } from 'react';
import Navigation from './Navigation';
import  { LoadingContext }  from './LoadingContext';

//renders the app
export default function App() {
  
  const [isLoading, setLoading] = useState(false);


   return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      <Navigation />
    </LoadingContext.Provider>
  );
}
