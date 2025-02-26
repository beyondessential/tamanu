import React from 'react';

import { Colors } from '../../constants';

export const ChevronIcon = ({ htmlColor = Colors.darkText, width = 10, height = 6, ...props }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 10 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4.99992 5.85523C4.84367 5.85523 4.69398 5.79242 4.58367 5.67992L0.171797 1.20555C-0.0572656 0.972422 -0.0572656 0.595234 0.171797 0.362422C0.401484 0.129609 0.775234 0.129609 1.00367 0.362422L4.99992 4.41555L8.99523 0.362109C9.22523 0.129297 9.59836 0.129297 9.82773 0.362109C10.0571 0.594609 10.0571 0.972422 9.82773 1.20555L5.41617 5.68055C5.30523 5.79242 5.15555 5.85523 4.99992 5.85523Z"
      fill={htmlColor}
    />
  </svg>
);
