import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const HeartOutline = React.memo(() => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Path
        d="M14.8 31.4C13.2 30 0 19 0 10.6C0 5.2 4.4 1 9.6 1C12 1 14.2 2 16 3.4C17.8 1.8 20 1 22.4 1C27.8 1 32 5.4 32 10.6C32 19 18.8 30 17.2 31.2C16.6 32 15.4 32 14.8 31.4ZM9.6 5C6.6 5 4 7.6 4 10.6C4 15 11 22.6 16 27C20.2 23.2 28 15.4 28 10.6C28 7.4 25.4 5 22.4 5C20.6 5 18.8 6 17.8 7.6C17 8.8 15.2 8.8 14.4 7.6C13.2 6 11.6 5 9.6 5Z"
        fill="black"
      />
    </Svg>
  );
});
