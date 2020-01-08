import React from 'react';
import Svg, { Circle, SvgProps } from 'react-native-svg';

export const EmptyCircle = React.memo((props: SvgProps) => (
  <Svg width="34" height="34" viewBox="0 0 34 34" fill="none" {...props}>
    <Circle
      cx="17"
      cy="17"
      r="16"
      fill="white"
      stroke="#DEDEDE"
      stroke-width="2"
    />
  </Svg>
));
