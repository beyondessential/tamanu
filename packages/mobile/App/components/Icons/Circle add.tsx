import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const CircleAdd = React.memo(() => (
  <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <Path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M16 0C7.163 0 0 7.164 0 16C0 24.837 7.163 32.001 16 32.001C24.836 32.001 32 24.837 32 16C32 7.164 24.836 0 16 0ZM24.989 17.565H17.557V24.999C17.557 25.886 16.839 26.604 15.951 26.604C15.066 26.604 14.347 25.885 14.347 24.999V17.565H6.913C6.026 17.565 5.308 16.847 5.308 15.96C5.309 15.073 6.027 14.354 6.913 14.354L14.348 14.355V6.921C14.348 6.034 15.067 5.316 15.952 5.316C16.84 5.316 17.558 6.035 17.558 6.921V14.356H24.99C25.879 14.356 26.597 15.075 26.597 15.961C26.597 16.847 25.878 17.565 24.989 17.565Z"
      fill="black"
    />
  </Svg>
));
