import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

const ArrowForward = React.memo((props: SvgProps) => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <Path
        d="M25.1368 16.0005C25.1368 16.5005 24.9357 16.9795 24.5767 17.3325L10.2587 31.4505C9.51275 32.1835 8.30475 32.1835 7.55975 31.4505C6.81475 30.7155 6.81475 29.5205 7.55975 28.7885L20.5298 16.0005L7.55875 3.2145C6.81375 2.4785 6.81375 1.2855 7.55875 0.5505C8.30375 -0.1835 9.51175 -0.1835 10.2578 0.5505L24.5778 14.6685C24.9358 15.0235 25.1368 15.5025 25.1368 16.0005Z"
        fill="black"
      />
    </Svg>
  );
});

export default ArrowForward;
