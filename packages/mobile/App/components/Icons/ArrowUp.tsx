import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export const ArrowUp = React.memo((props: SvgProps) => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill={'#2F4358'} {...props}>
      <Path d="M15.9995 6C16.4995 6 16.9785 6.201 17.3325 6.561L31.4495 20.88C32.1835 21.626 32.1835 22.833 31.4495 23.578C30.7145 24.323 29.5185 24.323 28.7875 23.578L15.9995 10.608L3.2145 23.578C2.4785 24.324 1.2845 24.324 0.5505 23.578C-0.1835 22.834 -0.1835 21.625 0.5505 20.879L14.6675 6.56C15.0235 6.201 15.5015 6 15.9995 6Z" />
    </Svg>
  );
});

export default ArrowUp;
