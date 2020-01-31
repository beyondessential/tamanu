import React, { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

export const ScheduledVaccine = memo(() => {
  return (
    <Svg width="87" height="80" viewBox="0 0 87 82" fill="none">
      <Path d="M86 1H1V81H86V1Z" fill="#F3F5F7" />
      <Path
        d="M44 57C52.8366 57 60 49.8366 60 41C60 32.1634 52.8366 25 44 25C35.1634 25 28 32.1634 28 41C28 49.8366 35.1634 57 44 57Z"
        fill="white"
        stroke="#DEDEDE"
        stroke-width="2"
      />
    </Svg>
  );
});
