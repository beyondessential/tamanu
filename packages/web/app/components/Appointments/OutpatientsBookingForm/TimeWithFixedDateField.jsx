import React from 'react';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { set as dateFnsSet, parseISO } from 'date-fns';
import { useDateTime } from '@tamanu/ui-components';
import { TimeInput } from '../../Field';

/**
 * A field for selecting a time while keeping the date fixed.
 * The resulting date-time will match the provided `date` (YYYY-MM-DD string) with the time set by the user.
 *
 * When useTimezone is true, the Formik value is expected in global timezone (matching DateTimeField
 * behaviour). The component converts to facility timezone for display and back on save.
 */
export const TimeWithFixedDateField = ({ field, date, useTimezone = false, ...props }) => {
  const { toFacilityDateTime, toStoredDateTime } = useDateTime();

  const displayValue =
    useTimezone && field.value ? toFacilityDateTime(field.value) : field.value;

  const handleChange = event => {
    if (!event.target.value || !date) {
      field.onChange({ target: { value: null, name: field.name } });
      return;
    }
    const [year, month, day] = date.split('-').map(Number);
    const facilityDateTime = toDateTimeString(
      dateFnsSet(parseISO(event.target.value), {
        year,
        date: day,
        month: month - 1,
      }),
    );
    const outputValue = useTimezone ? toStoredDateTime(facilityDateTime) : facilityDateTime;
    field.onChange({ target: { value: outputValue, name: field.name } });
  };

  return (
    <TimeInput
      name={field.name}
      value={displayValue}
      {...props}
      onChange={handleChange}
      data-testid="timeinput-vbul"
    />
  );
};
