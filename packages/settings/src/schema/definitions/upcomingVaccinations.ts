import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';

export const thresholdsSchema = yup.array(
  yup.object({
    threshold: yup
      .mixed()
      .test(
        'is-number-or-infinity',
        'Threshold must be a number or -Infinity',
        value => typeof value === 'number' || value === '-Infinity',
      ),
    status: yup.string().oneOf(Object.values(VACCINE_STATUS)),
  }),
);

export const thresholdsDefault = [
  {
    threshold: 28,
    status: VACCINE_STATUS.SCHEDULED,
  },
  {
    threshold: 7,
    status: VACCINE_STATUS.UPCOMING,
  },
  {
    threshold: -7,
    status: VACCINE_STATUS.DUE,
  },
  {
    threshold: -55,
    status: VACCINE_STATUS.OVERDUE,
  },
  {
    threshold: '-Infinity',
    status: VACCINE_STATUS.MISSED,
  },
];
