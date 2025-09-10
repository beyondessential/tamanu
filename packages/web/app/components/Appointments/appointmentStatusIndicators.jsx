import React from 'react';
import { TAMANU_COLORS } from '@tamanu/ui-components';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import {
  CheckIconFilled,
  CheckIconOutlined,
  CircleIconDashed,
  CircleIconOutlined,
  CrossIconFilled,
} from '../Icons';

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUSES.ARRIVED]: TAMANU_COLORS.purple,
  [APPOINTMENT_STATUSES.ASSESSED]: TAMANU_COLORS.pink,
  [APPOINTMENT_STATUSES.CANCELLED]: TAMANU_COLORS.darkText,
  [APPOINTMENT_STATUSES.CONFIRMED]: TAMANU_COLORS.blue,
  [APPOINTMENT_STATUSES.NO_SHOW]: TAMANU_COLORS.darkOrange,
  [APPOINTMENT_STATUSES.SEEN]: TAMANU_COLORS.green,
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
      htmlColor={APPOINTMENT_STATUS_COLORS[appointmentStatus] ?? TAMANU_COLORS.blue}
      {...props}
      data-testid="iconcomponent-95h6"
    />
  );
};
