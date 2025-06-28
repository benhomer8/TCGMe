import * as React from 'react';
import { Svg, Path, G, Text, TSpan } from 'react-native-svg';

const LogoSVG = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 268.07 212.9"
    {...props}
  >
    <G fill="#2e3192">
      <Text
        fontSize="182.6"
        fontFamily="row-Regular"
        transform="rotate(.66 -11066.644 63.74)"
      >
        <TSpan x="0" y="0">T</TSpan>
      </Text>
      <Text
        fontSize="109.18"
        fontFamily="row-Regular"
        transform="translate(82.45 122.68)"
      >
        <TSpan x="0" y="0">C</TSpan>
      </Text>
      <Text
        fontSize="173.93"
        fontFamily="row-Regular"
        transform="rotate(-2.02 3546.342 -4043.487)"
      >
        <TSpan x="0" y="0">G</TSpan>
      </Text>
      <Text
        fontSize="128.19"
        fontFamily="row-Regular"
        letterSpacing="-.02em"
        transform="rotate(6.95 -1551.112 368.894)"
      >
        <TSpan x="0" y="0">M</TSpan>
      </Text>
      <Text
        fontSize="128.19"
        fontFamily="row-Regular"
        letterSpacing="-.02em"
        transform="rotate(-14.53 901.742 -428.197)"
      >
        <TSpan x="0" y="0">e</TSpan>
      </Text>

      {/* Replace the path data below with your full paths */}
      <Path
        fill="#2e3192"
        d="M163.54 23.04c.06-.19..." // replace with actual full path
      />
      <Path
        fill="#2e3192"
        d="M264.49 124.8c-1.19-2.58..." // replace with actual full path
      />
    </G>
  </Svg>
);

export default LogoSVG;
