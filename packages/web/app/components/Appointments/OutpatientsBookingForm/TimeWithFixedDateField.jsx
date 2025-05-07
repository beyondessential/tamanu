import React from 'react';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { set as dateFnsSet, parseISO, getYear, getDate, getMonth } from 'date-fns';
import { TimeInput } from '../../Field';

/**
 * A field for selecting a time while keeping the date fixed.
 * The resulting date-time will match the provided `date` with the time set by the user.
 */
export const TimeWithFixedDateField = ({ field, date, ...props }) => {
  const handleChange = (event) => {
    const newValue = event.target.value
      ? toDateTimeString(
          dateFnsSet(parseISO(event.target.value), {
            year: getYear(date),
            date: getDate(date),
            month: getMonth(date),
          }),
        )
      : null;
    field.onChange({ target: { value: newValue, name: field.name } });
  };
  return (
    <TimeInput
      name={field.name}
      value={field.value}
      {...props}
      onChange={handleChange}
      data-testid="timeinput-vbul"
    />
  );
};
