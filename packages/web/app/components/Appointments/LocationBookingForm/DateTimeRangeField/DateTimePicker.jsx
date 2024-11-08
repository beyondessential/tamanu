import { isValid } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';

const DateTimePicker = ({
  disabled = false,
  required = false,

  datePickerLabel = <TranslatedText stringId="general.date.label" fallback="Date" />,
  datePickerName,
  onDateChange,

  timePickerLabel = <TranslatedText stringId="general.time.label" fallback="Time" />,
  timePickerName,
  timePickerVariant,
  onTimeChange,
}) => {
  const dateFieldValue = useFormikContext().values[datePickerName];
  const date = new Date(dateFieldValue); // Not using parseISO in case it’s already a date object
  const isValidDate = isValid(date);

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        label={datePickerLabel}
        name={datePickerName}
        onChange={onDateChange}
        required={required}
      />
      <TimeSlotPicker
        date={isValidDate ? date : null}
        disabled={disabled || !isValidDate}
        label={timePickerLabel}
        name={timePickerName}
        onChange={onTimeChange}
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
