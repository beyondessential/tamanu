import { isMatch } from 'date-fns';
import * as yup from 'yup';

export const datelessTimeStringSchema = yup.string().test({
  name: 'datelessTimeString',
  message: 'Start and end times for ‘bookingSlots’ must be a valid 24-hour time (e.g. 17:30)',
  test: str => {
    if (str === undefined) return true; // Don’t fail validation if falling back to default value
    return isMatch(str, 'HH:mm');
  },
});
