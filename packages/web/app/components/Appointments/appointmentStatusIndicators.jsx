import React from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import {
  CheckIconFilled,
  CheckIconOutlined,
  CircleIconDashed,
  CircleIconOutlined,
  CrossIconFilled,
} from '../Icons';
import { Colors } from '../../constants';

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUSES.ARRIVED]: Colors.purple,
  [APPOINTMENT_STATUSES.ASSESSED]: Colors.pink,
  [APPOINTMENT_STATUSES.CANCELLED]: Colors.darkText,
  [APPOINTMENT_STATUSES.CONFIRMED]: Colors.blue,
  [APPOINTMENT_STATUSES.NO_SHOW]: Colors.darkOrange,
  [APPOINTMENT_STATUSES.SEEN]: Colors.green,
};

export const APPOINTMENT_STATUS_ICONS = {
  [APPOINTMENT_STATUSES.ARRIVED]: CircleIconOutlined,
  [APPOINTMENT_STATUSES.ASSESSED]: CheckIconOutlined,
  [APPOINTMENT_STATUSES.CANCELLED]: CrossIconFilled,
  [APPOINTMENT_STATUSES.CONFIRMED]: CircleIconDashed,
  [APPOINTMENT_STATUSES.NO_SHOW]: CrossIconFilled,
  [APPOINTMENT_STATUSES.SEEN]: CheckIconFilled,
};

export const AppointmentStatusIndicator = ({ appointmentStatus, ...props }) => {
  const IconComponent = APPOINTMENT_STATUS_ICONS[appointmentStatus] ?? CircleIconOutlined;
  return (
    <IconComponent
      aria-label={appointmentStatus}
      htmlColor={APPOINTMENT_STATUS_COLORS[appointmentStatus] ?? Colors.blue}
      {...props}
      data-testid="iconcomponent-95h6"
    />
  );
};
