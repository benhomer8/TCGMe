import React, { useEffect, useRef } from 'react';
import LottieView from 'lottie-react-native';
import { View } from 'react-native';

const PackIcon = ({ shouldPlay, shouldReset}) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (shouldReset && animationRef.current) {
      animationRef.current.reset();
    }
  }, [shouldReset]);

  useEffect(() => {
    if (shouldPlay && animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [shouldPlay]);

  return (
    <View style={{ width: '300%', height: '300%', position: 'absolute', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <LottieView
        ref={animationRef}
        source={require('./assets/lottie_animations/packIcon.json')}
        loop={false}
        autoPlay={false}
        style={{ width: '100%', height: '100%', alignItems: 'center', overflow: 'hidden' }}
      />
    </View>
  );
};

export default PackIcon;
