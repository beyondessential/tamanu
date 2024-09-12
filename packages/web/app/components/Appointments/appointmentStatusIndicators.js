import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import {
  CheckIconFilled,
  CheckIconOutlined,
  CircleIconDashed,
  CircleIconOutlined,
  CrossIconFilled,
} from '../Icons';

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUSES.ARRIVED]: Colors.purple,
  [APPOINTMENT_STATUSES.ASSESSED]: Colors.pink,
  [APPOINTMENT_STATUSES.CONFIRMED]: Colors.blue,
  [APPOINTMENT_STATUSES.NO_SHOW]: Colors.darkOrange,
  [APPOINTMENT_STATUSES.SEEN]: Colors.green,
};

export const APPOINTMENT_STATUS_ICONS = {
  [APPOINTMENT_STATUSES.ARRIVED]: CircleIconOutlined,
  [APPOINTMENT_STATUSES.ASSESSED]: CheckIconOutlined,
  [APPOINTMENT_STATUSES.CONFIRMED]: CircleIconDashed,
  [APPOINTMENT_STATUSES.NO_SHOW]: CrossIconFilled,
  [APPOINTMENT_STATUSES.SEEN]: CheckIconFilled,
};
