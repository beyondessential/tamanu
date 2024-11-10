import { addDays } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';

import { TranslatedText } from '../../../Translation';
import { EndDateTimePicker, StartDateTimePicker } from './DateTimePicker';
import { DateTimeRangePicker } from './DateTimeRangePicker';

export const DateTimeRangeField = ({ disabled, required, separate = false, ...props }) => {
  const {
    values: { startDate },
  } = useFormikContext();

  if (separate) {
    const doDisableEndPicker = disabled || !startDate;
    return (
      <>
        <StartDateTimePicker disabled={disabled} required={required} />
        <EndDateTimePicker
          disabled={doDisableEndPicker}
          minDate={!doDisableEndPicker ? addDays(new Date(startDate), 1) : null}
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
