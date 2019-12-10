import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export const Calendar = React.memo((props: SvgProps) => {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="#DEDEDE" {...props}>
      <Path d="M15 2H13V0H10V2H6V0H3V2H1C0.448 2 0 2.448 0 3V15C0 15.552 0.448 16 1 16H15C15.552 16 16 15.552 16 15V3C16 2.448 15.552 2 15 2ZM14 14H2V7H14V14Z" />
    </Svg>
  );
});
