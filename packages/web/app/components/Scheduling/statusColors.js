import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUSES.ARRIVED]: Colors.purple,
  [APPOINTMENT_STATUSES.ASSESSED]: Colors.darkOrange,
  [APPOINTMENT_STATUSES.CONFIRMED]: Colors.blue,
  [APPOINTMENT_STATUSES.NO_SHOW]: Colors.pink,
  [APPOINTMENT_STATUSES.SEEN]: Colors.green,
};
