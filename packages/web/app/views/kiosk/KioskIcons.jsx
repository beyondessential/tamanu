import React from 'react';

import { FormBackIcon, FormCheckIcon, FormInfoIcon, FormNextIcon } from '@tamanu/ui-components';

export {
  FormBackIcon as BackIcon,
  FormCheckIcon as CheckIcon,
  FormInfoIcon as InfoIcon,
  FormNextIcon as NextIcon,
};

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

export const HelpIcon = props => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10" {...stroke} strokeWidth="2" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5" {...stroke} strokeWidth="2" />
    <circle cx="12" cy="17.5" r="1.2" fill="currentColor" />
  </Svg>
);

export const GlobeIcon = props => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9.5" {...stroke} strokeWidth="1.8" />
    <path
      d="M2.5 12h19M12 2.5c2.6 2.8 3.8 6 3.8 9.5S14.6 18.7 12 21.5M12 2.5C9.4 5.3 8.2 8.5 8.2 12s1.2 6.7 3.8 9.5"
      {...stroke}
      strokeWidth="1.8"
    />
  </Svg>
);

export const AccessibilityIcon = props => (
  <Svg {...props}>
    <circle cx="12" cy="4.5" r="2" fill="currentColor" />
    <path d="M4 8.5l8 1.5 8-1.5M12 10v5m0 0l-3.5 6.5M12 15l3.5 6.5" {...stroke} strokeWidth="1.9" />
  </Svg>
);

export const CalendarIcon = props => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...stroke} strokeWidth="1.8" />
    <path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} strokeWidth="1.8" />
  </Svg>
);

export const ReceptionIcon = props => (
  <Svg {...props}>
    <circle cx="12" cy="7" r="3.2" {...stroke} strokeWidth="1.8" />
    <path
      d="M5.5 16.5c.8-2.8 3.4-4.3 6.5-4.3s5.7 1.5 6.5 4.3M2.5 17h19v3.5h-19z"
      {...stroke}
      strokeWidth="1.8"
    />
  </Svg>
);

export const AlertIcon = props => (
  <Svg {...props}>
    <path d="M12 6.5v7" {...stroke} strokeWidth="2.6" />
    <circle cx="12" cy="17.8" r="1.6" fill="currentColor" />
  </Svg>
);

export const ChevronDownIcon = props => (
  <Svg {...props}>
    <path d="M6 9.5l6 6 6-6" {...stroke} strokeWidth="2.2" />
  </Svg>
);

export const ClockIcon = props => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9.5" {...stroke} strokeWidth="1.8" />
    <path d="M12 7v5.5l3.5 2" {...stroke} strokeWidth="1.8" />
  </Svg>
);

export const RestartIcon = props => (
  <Svg {...props}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" {...stroke} strokeWidth="2" />
  </Svg>
);
