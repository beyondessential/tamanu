import React from 'react';

export const VitalVectorIcon = React.memo(() => (
  <svg width="19" height="12" viewBox="0 0 19 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.38675 12L6.93374 6.44376L10.6317 10.1418L18.49 1.30354L17.1864 0L10.6317 7.36826L6.93374 3.67026L0 10.6133L1.38675 12Z"
      fill="#326699"
    />
  </svg>
));

export const InwardArrowVectorIcon = React.memo(({ color }) => (
  <svg width="9" height="22" viewBox="0 0 9 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="Group 214">
      <path id="Vector 57" d="M1 1L4.5 5L8 1" stroke={color} strokeLinecap="round" />
      <path id="Vector 58" d="M8 21L4.5 17L1 21" stroke={color} strokeLinecap="round" />
      <line id="Line 138" x1="4.5" y1="5" x2="4.5" y2="17" stroke={color} />
    </g>
  </svg>
));
