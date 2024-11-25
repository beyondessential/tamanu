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
  const { setFieldValue, values } = useFormikContext();

  const hasSelectedLocation = !!values.locationId;

  const dateFieldValue = values[datePickerName];
  const date = dateFieldValue ? new Date(dateFieldValue) : null; // Not using parseISO in case it’s already a date object
  const isValidDate = isValid(date);

  const { id: appointmentId, locationId } = values;

  /** Keep synchronised with start date field for overnight bookings */
  const flushChangeToStartDateField = e => void setFieldValue('startDate', e.target.value);

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        helperText={dateFieldHelperText}
        label={datePickerLabel}
        name={datePickerName}
        onChange={flushChangeToStartDateField}
        required={required}
        {...props}
      />
      <TimeSlotPicker
        date={isValidDate ? date : null}
        disabled={disabled || !hasSelectedLocation || !isValidDate}
        // Changes to any of these require state to refresh
        key={`${appointmentId}_${locationId}_${dateFieldValue}`}
        label={timePickerLabel}
        required={required}
        variant="range"
      />
    </>
  );
};
