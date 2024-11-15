import { isValid } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { toDateString } from '@tamanu/shared/utils/dateTime';

import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';

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
