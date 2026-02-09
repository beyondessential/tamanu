import React from 'react';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { set as dateFnsSet, parseISO } from 'date-fns';
import { TimeInput } from '../../Field';

/**
 * A field for selecting a time while keeping the date fixed.
 * The resulting date-time will match the provided `date` (YYYY-MM-DD string) with the time set by the user.
 */
export const TimeWithFixedDateField = ({ field, date, ...props }) => {
  const handleChange = (event) => {
    if (!event.target.value || !date) {
      field.onChange({ target: { value: null, name: field.name } });
      return;
    }
    const [year, month, day] = date.split('-').map(Number);
    const newValue = toDateTimeString(
      dateFnsSet(parseISO(event.target.value), {
        year,
        date: day,
        month: month - 1,
      }),
    );
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
