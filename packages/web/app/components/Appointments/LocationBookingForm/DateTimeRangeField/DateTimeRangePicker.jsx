import { isValid } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';

import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';

export const DateTimeRangePicker = ({
  dateFieldHelperText,
  datePickerLabel = <TranslatedText stringId="general.date.label" fallback="Date" />,
  datePickerName,
  disabled = false,
  required,
  timePickerLabel = <TranslatedText stringId="general.time.label" fallback="Time" />,
  ...props
}) => {
  const { values, errors } = useFormikContext();

  const hasSelectedLocation = !!values.locationId;

  const dateFieldValue = values[datePickerName];
  const date = dateFieldValue ? new Date(dateFieldValue) : null; // Not using parseISO in case it’s already a date object
  const isValidDate = isValid(date);

  const locationId = values.locationId;

  const isDisabled = disabled || !hasSelectedLocation || !isValidDate

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
        date={isValidDate ? date : null}
        disabled={isDisabled}
        key={`${locationId}_${dateFieldValue}`}
        label={timePickerLabel}
        required={required}
        $error={!isDisabled && (errors.startTime || errors.endTime)}
        variant="range"
      />
    </>
  );
};
