import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export const ArrowBack = React.memo((props: SvgProps) => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <Path
        d="M7 16.0005C7 15.5005 7.201 15.0215 7.561 14.6685L21.879 0.5505C22.625 -0.1835 23.832 -0.1835 24.577 0.5505C25.322 1.2855 25.322 2.4815 24.577 3.2125L11.607 16.0005L24.578 28.7855C25.323 29.5215 25.323 30.7155 24.578 31.4495C23.834 32.1835 22.625 32.1835 21.879 31.4495L7.559 17.3325C7.201 16.9775 7 16.4985 7 16.0005Z"
        fill="black"
      />
    </Svg>
  );
});
