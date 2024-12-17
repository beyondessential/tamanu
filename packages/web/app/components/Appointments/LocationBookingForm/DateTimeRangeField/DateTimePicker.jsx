import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { toDateString, toDateTimeString } from '@tamanu/shared/utils/dateTime';

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
  minDate,
  required = false,
  timePickerVariant,

  datePickerLabel = <TranslatedText stringId="general.date.label" fallback="Date" />,
  datePickerName,
  timePickerLabel = <TranslatedText stringId="general.time.label" fallback="Time" />,
  timePickerName,
}) => {
  const { values, setFieldValue } = useFormikContext();
  const dateFieldValue = values[datePickerName];
  const isValidDate = isValid(parseISO(dateFieldValue));

  /** Keep synchronised with date field for non-overnight bookings */
  const flushChangeToDateField = e => void setFieldValue('date', e.target.value);

  const startDateTimeString =
    values.startDate && toDateTimeString(endOfDay(parseISO(values.startDate)));
  const endDateTimeString =
    values.endDate && toDateTimeString(startOfDay(parseISO(values.endDate)));

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
        onChange={flushChangeToDateField}
        required={required}
        helperText={
          hasConflict && (
            <ErrorSpan>
              <TranslatedText
                stringId="locationBooking.timePicker.locationNotAvailableWarning"
                fallback="Location not available"
              />
            </ErrorSpan>
          )
        }
        saveDateAsString
      />
      <TimeSlotPicker
        date={isValidDate ? dateFieldValue : null}
        disabled={disabled || !isValidDate || hasConflict}
        hasNoLegalSelection={hasConflict}
        label={timePickerLabel}
        name={timePickerName}
        required={required}
        variant={timePickerVariant}
      />
    </>
  );
};

export const StartDateTimePicker = styled(DateTimePicker).attrs({
  datePickerLabel: <TranslatedText stringId="general.startDate.label" fallback="Start date" />,
  datePickerName: 'startDate',
  timePickerLabel: (
    <TranslatedText stringId="general.bookingStartTime.label" fallback="Booking start time" />
  ),
  timePickerName: 'startTime',
  timePickerVariant: 'start',
})``;

export const EndDateTimePicker = styled(DateTimePicker).attrs({
  datePickerLabel: <TranslatedText stringId="general.endDate.label" fallback="End date" />,
  datePickerName: 'endDate',
  timePickerLabel: (
    <TranslatedText stringId="general.bookingEndTime.label" fallback="Booking end time" />
  ),
  timePickerName: 'endTime',
  timePickerVariant: 'end',
})``;
