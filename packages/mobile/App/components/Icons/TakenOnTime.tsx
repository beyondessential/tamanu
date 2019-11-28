import React from 'react';
import Svg, { Path, Circle, SvgProps } from 'react-native-svg';

const TakenOnTime = React.memo((props: SvgProps) => {
  return (
    <Svg width="34" height="34" viewBox="0 0 34 34" fill="none" {...props}>
      <Circle
        cx="17"
        cy="17"
        r="16"
        fill="white"
        stroke="#DEDEDE"
        stroke-width="2"
      />
      <Circle cx="17" cy="17" r="17" fill="#47CA80" />
      <Path
        d="M22.3452 10.5829C19.7267 14.0999 17.1072 17.6174 14.4877 21.1354C14.8882 20.9174 15.2882 20.6999 15.6882 20.4814C16.6047 20.4754 16.7742 21.0434 15.9032 20.2184C15.2632 19.6099 14.6227 19.0029 13.9827 18.3954C13.1132 17.5699 12.2447 16.7449 11.3757 15.9204C10.1072 14.7169 8.14216 16.5819 9.40916 17.7864C10.9187 19.2189 12.4272 20.6509 13.9367 22.0839C15.0272 23.1194 16.0812 23.5509 17.1197 22.1569C19.6617 18.7439 22.2042 15.3289 24.7452 11.9144C25.7847 10.5214 23.3727 9.20593 22.3452 10.5829Z"
        fill="white"
      />
    </Svg>
  );
});

export default TakenOnTime;
