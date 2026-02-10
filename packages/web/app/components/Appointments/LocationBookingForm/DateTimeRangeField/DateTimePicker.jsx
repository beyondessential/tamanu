import { isValid, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { useDateTimeFormat } from '@tamanu/ui-components';

import { useLocationBookingsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';

const ErrorSpan = styled.span`
  color: ${Colors.alert};
  display: contents;
`;

const DateTimePicker = ({
  disabled = false,
  onChange,
  minDate,
  required = false,
  timePickerVariant,

  datePickerLabel = (
    <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid="translatedtext-7fay"
    />
  ),
  datePickerName,
  timePickerLabel = (
    <TranslatedText
      stringId="general.time.label"
      fallback="Time"
      data-testid="translatedtext-irhj"
    />
  ),
  timePickerName,
}) => {
  const { values, setFieldValue } = useFormikContext();
  const { getDayBoundaries } = useDateTimeFormat();
  const dateFieldValue = values[datePickerName];
  const isValidDate = isValid(parseISO(dateFieldValue));

  /** Keep startDate synchronised with date field for non-overnight bookings */
  const flushChangeToDateField = (e) => {
    if (datePickerName === 'startDate') {
      setFieldValue('date', e.target.value);
    }
  };

  const startDateTimeString = getDayBoundaries(values.startDate)?.end;
  const endDateTimeString = getDayBoundaries(values.endDate)?.start;


  /**
   * Check for any booked timeslots *between* dates in overnight bookings. {@link TimeSlotPicker}
   * handles conflicts in the “bookend” days, so this query effectively uses an open interval.
   */
  const { data } = useLocationBookingsQuery(
    {
      after: startDateTimeString,
      before: endDateTimeString,
      all: true,
      locationId: values.locationId,
    },
    {
      enabled: !!(
        datePickerName === 'endDate' &&
        values.startDate &&
        values.endDate &&
        values.locationId
      ),
    },
  );

  const hasConflict = datePickerName === 'endDate' && !values.id && data?.count > 0;

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        label={datePickerLabel}
        min={minDate}
        name={datePickerName}
        onChange={(e) => {
          flushChangeToDateField(e);
          onChange?.(e);
        }}
        required={required}
        helperText={
          hasConflict && (
            <ErrorSpan data-testid="errorspan-xkp6">
              <TranslatedText
                stringId="locationBooking.timePicker.locationNotAvailableWarning"
                fallback="Location not available"
                data-testid="translatedtext-2lnp"
              />
            </ErrorSpan>
          )
        }
        saveDateAsString
        data-testid="field-84i5"
      />
      <TimeSlotPicker
        date={isValidDate ? dateFieldValue : null}
        disabled={disabled || !isValidDate || hasConflict}
        hasNoLegalSelection={hasConflict}
        label={timePickerLabel}
        name={timePickerName}
        required={required}
        variant={timePickerVariant}
        data-testid="timeslotpicker-2c95"
      />
    </>
  );
};

export const StartDateTimePicker = styled(DateTimePicker).attrs({
  datePickerLabel: (
    <TranslatedText
      stringId="general.startDate.label"
      fallback="Start date"
      data-testid="translatedtext-ibtg"
    />
  ),
  datePickerName: 'startDate',
  timePickerLabel: (
    <TranslatedText
      stringId="general.bookingStartTime.label"
      fallback="Booking start time"
      data-testid="translatedtext-wzo0"
    />
  ),
  timePickerName: 'startTime',
  timePickerVariant: 'start',
})``;

export const EndDateTimePicker = styled(DateTimePicker).attrs({
  datePickerLabel: (
    <TranslatedText
      stringId="general.endDate.label"
      fallback="End date"
      data-testid="translatedtext-zqk0"
    />
  ),
  datePickerName: 'endDate',
  timePickerLabel: (
    <TranslatedText
      stringId="general.bookingEndTime.label"
      fallback="Booking end time"
      data-testid="translatedtext-ez36"
    />
  ),
  timePickerName: 'endTime',
  timePickerVariant: 'end',
})``;
