import { isValid, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';

import { useLocationBookingsContext } from '../../../../contexts/LocationBookings';
import { DateField, Field } from '../../../Field';
import { TranslatedText } from '../../../Translation';
import { TimeSlotPicker } from './TimeSlotPicker';
import { TIME_SLOT_PICKER_VARIANTS } from './constants';

export const DateTimeRangePicker = ({
  dateFieldHelperText,
  datePickerLabel = (
    <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid="translatedtext-m27g"
    />
  ),
  datePickerName,
  disabled = false,
  required,
  timePickerLabel = (
    <TranslatedText
      stringId="general.time.label"
      fallback="Time"
      data-testid="translatedtext-pvp4"
    />
  ),
  ...props
}) => {
  const { setFieldValue, values } = useFormikContext();
  const { updateSelectedCell } = useLocationBookingsContext();

  const hasSelectedLocation = !!values.locationId;

  const dateFieldValue = values[datePickerName];
  const isValidDate = dateFieldValue && isValid(parseISO(dateFieldValue));

  const { id: appointmentId, locationId } = values;

  /** Keep synchronised with start date field for overnight bookings */
  const flushChangeToStartDateField = (e) => void setFieldValue('startDate', e.target.value);

  const clearStartEndTimes = () => {
    setFieldValue('startTime', undefined);
    setFieldValue('endTime', undefined);
  };

  return (
    <>
      <Field
        component={DateField}
        disabled={disabled}
        helperText={dateFieldHelperText}
        label={datePickerLabel}
        name={datePickerName}
        onChange={(e) => {
          updateSelectedCell({ date: parseISO(e.target.value) });
          flushChangeToStartDateField(e);
          clearStartEndTimes();
        }}
        required={required}
        {...props}
        data-testid="field-ui1x"
      />
      <TimeSlotPicker
        date={isValidDate ? dateFieldValue : null}
        disabled={disabled || !hasSelectedLocation || !isValidDate}
        key={appointmentId ?? `${locationId}_${dateFieldValue}`}
        label={timePickerLabel}
        required={required}
        variant={TIME_SLOT_PICKER_VARIANTS.RANGE}
        data-testid="timeslotpicker-1tfi"
      />
    </>
  );
};
