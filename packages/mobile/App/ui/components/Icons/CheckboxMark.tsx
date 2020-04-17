import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export const CheckboxMark = React.memo((props: SvgProps) => (
  <Svg width="9" height="7" viewBox="0 0 9 7" fill="white" {...props}>
    <Path
      d="M0.75 3.5L3.25 6L8.25 1"
      stroke="#326699"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));
