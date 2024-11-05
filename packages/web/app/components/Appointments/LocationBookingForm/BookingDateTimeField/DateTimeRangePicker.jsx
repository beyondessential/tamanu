import React from 'react';

import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';
import { useFormikContext } from 'formik';

export const DateTimeRangePicker = ({
  dateFieldHelperText,
  datePickerLabel = <TranslatedText stringId="general.date.label" fallback="Date" />,
  datePickerName,
  disabled,
  required,
  timePickerLabel = <TranslatedText stringId="general.time.label" fallback="Time" />,
  ...props
}) => {
  const { values } = useFormikContext();
  const dateFieldValue = values[datePickerName];
  const locationId = values.locationId;

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        helperText={dateFieldHelperText}
        label={datePickerLabel}
        name={datePickerName}
        required={required}
        {...props}
      />
      <TimeSlotPicker
        date={dateFieldValue ? new Date(dateFieldValue) : null}
        disabled={disabled || !dateFieldValue}
        key={`${locationId}_${dateFieldValue}`}
        label={timePickerLabel}
        required={required}
        variant="range"
      />
    </>
  );
};
