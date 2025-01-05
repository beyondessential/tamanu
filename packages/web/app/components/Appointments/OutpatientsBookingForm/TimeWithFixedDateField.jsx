import React from 'react';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { set as dateFnsSet, parseISO, getYear, getDate, getMonth } from 'date-fns';
import { TimeInput } from '../../Field';

/**
 * A field for selecting a time while keeping the date fixed.
 * The resulting date-time will match the provided `date` with the time set by the user.
 */
export const TimeWithFixedDateField = ({ field, date, ...props }) => {
  const handleChange = event => {
    const newValue = toDateTimeString(
      dateFnsSet(parseISO(event.target.value), {
        year: getYear(date),
        date: getDate(date),
        month: getMonth(date),
      }),
    );
    field.onChange({ target: { value: newValue, name: field.name } });
  };
  return <TimeInput name={field.name} value={field.value} {...props} onChange={handleChange} />;
};
