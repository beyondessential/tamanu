import React from 'react';

const Svg = ({ children, ...props }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    {children}
  </svg>
);

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const FormCheckIcon = props => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} strokeWidth="2.6" />
  </Svg>
);

export const FormInfoIcon = props => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9.5" {...stroke} strokeWidth="1.8" />
    <path d="M12 11v5.5" {...stroke} strokeWidth="2" />
    <circle cx="12" cy="7.7" r="1.2" fill="currentColor" />
  </Svg>
);

export const FormBackIcon = props => (
  <Svg {...props}>
    <path d="M14.5 6l-6 6 6 6" {...stroke} strokeWidth="2.2" />
  </Svg>
);

export const FormNextIcon = props => (
  <Svg {...props}>
    <path d="M9.5 6l6 6-6 6" {...stroke} strokeWidth="2.2" />
  </Svg>
);

export const FormCameraIcon = props => (
  <Svg {...props}>
    <path
      d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
      {...stroke}
      strokeWidth="1.8"
    />
    <circle cx="12" cy="13" r="3.5" {...stroke} strokeWidth="1.8" />
  </Svg>
);
