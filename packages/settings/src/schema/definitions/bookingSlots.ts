import * as yup from 'yup';

export const datelessTimeStringSchema = yup.string().test({
  name: 'datelessTimeString',
  message: 'Start and end times for ‘bookingSlots’ must be a valid 24-hour time (e.g. 17:30)',
  test: str => {
    // Don’t fail validation if falling back to default value
    if (str === undefined) return true;

    // Verify (with an arbitrary date which we don’t care about) that time can be parsed
    const datetime = new Date(`2000-01-01T${str.trim()}`);
    return !Number.isNaN(datetime.valueOf());
  },
});
