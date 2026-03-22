import { addDays, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';

import { toDateString } from '@tamanu/utils/dateTime';

import { TranslatedText } from '../../../Translation';
import { EndDateTimePicker, StartDateTimePicker } from './DateTimePicker';
import { DateTimeRangePicker } from './DateTimeRangePicker';

const dayAfter = (dateStr) => {
  const date = parseISO(dateStr);
  return addDays(date, 1);
};

export const DateTimeRangeField = ({
  disabled,
  onChangeStartDate,
  onChangeEndDate,
  required,
  separate = false,
  ...props
}) => {
  const {
    values: { locationId, startDate },
  } = useFormikContext();

  if (separate) {
    const isEndPickerDisabled = disabled || !locationId || !startDate;
    return (
      <>
        <StartDateTimePicker
          disabled={disabled}
          onChange={onChangeStartDate}
          required={required}
          data-testid="startdatetimepicker-qu3b"
        />
        <EndDateTimePicker
          disabled={isEndPickerDisabled}
          minDate={isEndPickerDisabled ? null : toDateString(dayAfter(startDate))}
          required={required}
          onChange={onChangeEndDate}
          data-testid="enddatetimepicker-9ofp"
        />
      </>
    );
  }

  return (
    <DateTimeRangePicker
      datePickerLabel={
        <TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid="translatedtext-8d41"
        />
      }
      datePickerName="date"
      disabled={disabled}
      required={required}
      timePickerLabel={
        <TranslatedText
          stringId="locationBooking.bookingTime.label"
          fallback="Booking time"
          data-testid="translatedtext-iqeq"
        />
      }
      {...props}
      data-testid="datetimerangepicker-yiks"
    />
  );
};
