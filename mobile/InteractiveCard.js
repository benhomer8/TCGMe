import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { View, Text, Image } from 'react-native';
import LogoSVG from './LogoSVG';
import LottieView from 'lottie-react-native';

const rainbowEffect = require('./assets/lottie_animations/rainbow_gradient.json');

export default function InteractiveCard({ selectedCard, CARD_HEIGHT, CARD_WIDTH,}) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = interpolate(
        event.y,
        [0, CARD_HEIGHT],
        [10, -10],
        Extrapolate.CLAMP
      );
      rotateY.value = interpolate(
        event.x,
        [0, CARD_WIDTH],
        [-10, 10],
        Extrapolate.CLAMP
      );
    })
    .onFinalize(() => {
      rotateX.value = withTiming(0);
      rotateY.value = withTiming(0);
    });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.modalContent, { backgroundColor: selectedCard?.color || '#fff', borderWidth: 3, borderColor: 'grey', height: CARD_HEIGHT,
              width: CARD_WIDTH, }, rStyle,]}>
          {selectedCard?.isFoil && (
          <LottieView
              source={rainbowEffect}
              autoPlay
              loop
              style={styles.rainbowRareEffect}
            />
          )}
          <Text style={[ 
            styles.name,{
            fontSize: 20,
            marginTop: '3%',
          }
        ]
          }>{selectedCard?.name}</Text>
          <Image source={{ uri: selectedCard?.imageUri }} style={styles.modalImage} />

          <View style={{width: '100%', height: '30%', alignItems: 'center', justifyContent: 'center'}}>
          <Text numberOfLines={6} style={styles.modalCaption}>{selectedCard?.caption}</Text>
          </View>

          <View style={{height: '20%', width: '90%', flexDirection: 'row', justifyContent: 'space-between',}}>

            

            <Text style={styles.modalMeta}>
              {selectedCard?.createdAt } 
            </Text>

            <LogoSVG style={{height: '30%', width: '30%', marginTop: '6%', position: 'absolute', left: "80%"   }}></LogoSVG>

          </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    height: "60%",
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    overflow: 'hidden',

  },
  modalImage: {
    width: '93%',
    height: '50%',
    borderRadius: 5,
    marginTop: '2%',
    borderColor: 'grey',
    borderWidth: 2,
  },
  modalCaption: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: "90%",
    
  },
  modalMeta: {
    marginTop: '10%',
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  rainbowRareEffect: {
    opacity: 0.3, 
    width: '200%',
    height: '200%',
    position: 'absolute',
    overflow: 'hidden'
  },


});