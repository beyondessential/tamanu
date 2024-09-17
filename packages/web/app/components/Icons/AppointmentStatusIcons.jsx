import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_ICONS,
} from '../Appointments/appointmentStatusIndicators';

const Svg = styled.svg.attrs({
  width: 10,
  height: 10,
  viewBox: '0 0 10 10',
  xmlns: 'http://www.w3.org/2000/svg',
})`
  align-self: center;
  fill: transparent;
`;

export const CheckIconFilled = ({ htmlColor = 'currentColor', ...props }) => (
  <Svg {...props}>
    <path
      d="M5.10158 0C2.3795 0 0.152344 2.25 0.152344 5C0.152344 7.75 2.3795 10 5.10158 10C7.82366 10 10.0508 7.75 10.0508 5C10.0508 2.25 7.82366 0 5.10158 0ZM7.86491 3.625L4.56541 6.95833C4.48293 7.04167 4.40044 7.08333 4.27671 7.08333C4.15298 7.08333 4.07049 7.04167 3.988 6.95833L2.33826 5.29167C2.17328 5.125 2.17328 4.875 2.33826 4.70833C2.50323 4.54167 2.75069 4.54167 2.91567 4.70833L4.27671 6.08333L7.2875 3.04167C7.45247 2.875 7.69993 2.875 7.86491 3.04167C8.02988 3.20833 8.02988 3.45833 7.86491 3.625Z"
      fill={htmlColor}
    />
  </Svg>
);

export const CheckIconOutlined = ({ htmlColor = 'currentColor', ...props }) => (
  <Svg {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 5C0 2.25 2.25 0 5 0C7.75 0 10 2.25 10 5C10 7.75 7.75 10 5 10C2.25 10 0 7.75 0 5ZM0 5C0 2.23858 2.23858 0 5 0C7.76142 0 10 2.23858 10 5C10 7.76142 7.76142 10 5 10C2.23858 10 0 7.76142 0 5ZM4.45833 6.95833L7.79167 3.625C7.95833 3.45833 7.95833 3.20833 7.79167 3.04167C7.625 2.875 7.375 2.875 7.20833 3.04167L4.16667 6.08333L2.79167 4.70833C2.625 4.54167 2.375 4.54167 2.20833 4.70833C2.04167 4.875 2.04167 5.125 2.20833 5.29167L3.875 6.95833C3.95833 7.04167 4.04167 7.08333 4.16667 7.08333C4.29167 7.08333 4.375 7.04167 4.45833 6.95833Z"
      fill={htmlColor}
    />
    <circle cx="5" cy="5" r="4.5" stroke={htmlColor} />
  </Svg>
);

export const CircleIconDashed = ({ htmlColor = 'currentColor', ...props }) => (
  <Svg {...props}>
    <circle cx="5" cy="5" r="4.5" stroke={htmlColor} strokeDasharray="2 2" />
  </Svg>
);

export const CircleIconOutlined = ({ htmlColor = 'currentColor', ...props }) => (
  <Svg {...props}>
    <circle cx="5" cy="5" r="4.5" stroke={htmlColor} />
  </Svg>
);

export const CrossIconFilled = ({ htmlColor = 'currentColor', ...props }) => (
  <Svg {...props}>
    <circle cx="5" cy="5" r="5" fill={htmlColor} />
    <path
      d="M6.86567 6.42386L5.53984 5.09803L6.86567 3.77221C6.99825 3.63963 6.99825 3.46285 6.86567 3.33027C6.73308 3.19768 6.55631 3.19768 6.42373 3.33027L5.0979 4.65609L3.77208 3.33027C3.63949 3.19768 3.46272 3.19768 3.33013 3.33027C3.19755 3.46285 3.19755 3.63963 3.33013 3.77221L4.65596 5.09803L3.33013 6.42386C3.19755 6.55644 3.19755 6.73322 3.33013 6.8658C3.46272 6.99838 3.63949 6.99838 3.77208 6.8658L5.0979 5.53998L6.42373 6.8658C6.55631 6.99838 6.73308 6.99838 6.86567 6.8658C6.99825 6.73322 6.99825 6.55644 6.86567 6.42386Z"
      fill="white"
    />
  </Svg>
);

export const AppointmentStatusIcon = ({ appointmentStatus, ...props }) => {
  const IconComponent = APPOINTMENT_STATUS_ICONS[appointmentStatus] ?? CircleIconOutlined;
  const fill = APPOINTMENT_STATUS_COLORS[appointmentStatus] ?? Colors.blue;
  return <IconComponent aria-label={appointmentStatus} htmlColor={fill} {...props} />;
};
