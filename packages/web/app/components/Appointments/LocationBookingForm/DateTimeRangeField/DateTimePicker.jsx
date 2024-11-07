import { useFormikContext } from 'formik';
import React from 'react';

import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';

export const DateTimePicker = ({
  disabled = false,
  datePickerLabel = <TranslatedText stringId="general.date.label" fallback="Date" />,
  timePickerLabel = <TranslatedText stringId="general.time.label" fallback="Time" />,
  timePickerVariant,
  onDateChange,
  onTimeChange,
  required = false,
}) => {
  const dateFieldName = `${name}_date`;
  const dateFieldValue = useFormikContext().values[dateFieldName];

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        label={datePickerLabel}
        name={dateFieldName}
        onChange={onDateChange}
        required={required}
      />
      <TimeSlotPicker
        date={dateFieldValue}
        label={timePickerLabel}
        name={`${name}_datetime`}
        onChange={onTimeChange}
        required={required}
        variant={timePickerVariant}
      />
    </>
  );
};
