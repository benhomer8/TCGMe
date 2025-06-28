import React, { useEffect, useRef } from 'react';
import LottieView from 'lottie-react-native';
import { View } from 'react-native';

const NavIcon = ({ shouldPlay, shouldReset, source, height, width }) => {
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
    <View style={{ width: width, height: height, position: 'absolute', justifyContent: 'center', alignItems: 'center'}}>
      <LottieView
        ref={animationRef}
        source={source}
        loop={false}
        autoPlay={false}
        style={{ width: '100%', height: '100%', alignItems: 'center'}}
      />
    </View>
  );
};

export default NavIcon;
