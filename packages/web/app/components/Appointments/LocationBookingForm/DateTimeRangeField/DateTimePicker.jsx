import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { toDateString, toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';
import { FormHelperText } from '@material-ui/core';
import { useLocationBookingsQuery } from '../../../../api/queries';

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
  const date = dateFieldValue ? new Date(dateFieldValue) : null;
  const isValidDate = isValid(date);

  /** Keep synchronised with date field for non-overnight bookings */
  const flushChangeToDateField = e => void setFieldValue('date', e.target.value);

  const startDateString = values.startDate
    ? toDateTimeString(endOfDay(parseISO(values.startDate)))
    : null;
  const endDateString = values.endDate
    ? toDateTimeString(startOfDay(parseISO(values.endDate)))
    : null;

  // Check for any booked timeslots between dates in overnight bookings
  const { data } = useLocationBookingsQuery(
    {
      after: startDateString,
      before: endDateString,
      all: true,
      locationId: values.locationId,
    },
    { enabled: !!(values.startDate && values.endDate && values.locationId) },
  );

  const showUnavailableLocationWarning = datePickerName === 'endDate' && data?.count > 0;

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        label={datePickerLabel}
        min={isValid(minDate) ? toDateString(minDate) : null}
        name={datePickerName}
        onChange={flushChangeToDateField}
        required={required}
        helperText={
          showUnavailableLocationWarning && (
            <FormHelperText error>Location not available </FormHelperText>
          )
        }
      />
      <TimeSlotPicker
        date={isValidDate ? date : null}
        disabled={disabled || !isValidDate}
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
  timePickerLabel: <TranslatedText stringId="general.startTime.label" fallback="Start time" />,
  timePickerName: 'startTime',
  timePickerVariant: 'start',
})``;

export const EndDateTimePicker = styled(DateTimePicker).attrs({
  datePickerLabel: <TranslatedText stringId="general.endDate.label" fallback="End date" />,
  datePickerName: 'endDate',
  timePickerLabel: <TranslatedText stringId="general.endTime.label" fallback="End time" />,
  timePickerName: 'endTime',
  timePickerVariant: 'end',
})``;
