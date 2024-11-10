import { addDays, endOfDay, startOfDay } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../../../api/queries';
import { TranslatedText } from '../../../Translation';
import { EndDateTimePicker, StartDateTimePicker } from './DateTimePicker';
import { DateTimeRangePicker } from './DateTimeRangePicker';

export const DateTimeRangeField = ({
  disabled,
  editMode,
  required,
  separate = false,
  ...props
}) => {
  const {
    values: { startDate, endDate, locationId, patientId },
  } = useFormikContext();
  const { data: existingLocationBookings, isFetched } = useAppointmentsQuery(
    {
      after: startDate ? toDateTimeString(startOfDay(new Date(startDate))) : null,
      before: endDate ? toDateTimeString(endOfDay(new Date(endDate))) : null,
      all: true,
      locationId,
      patientId,
    },
    { enabled: !!(startDate && endDate && locationId && patientId) },
  );

  if (separate) {
    return (
      <>
        <StartDateTimePicker disabled={disabled} required={required} />
        <EndDateTimePicker
          disabled={disabled || !startDate}
          minDate={addDays(new Date(startDate), 1)}
          required={required}
        />
      </>
    );
  }

  return (
    <DateTimeRangePicker
      datePickerLabel={<TranslatedText stringId="general.date.label" fallback="Date" />}
      datePickerName="date"
      disabled={disabled}
      required={required}
      timePickerLabel={
        <TranslatedText stringId="locationBooking.bookingTime.label" fallback="Booking time" />
      }
      {...props}
    />
  );
};
