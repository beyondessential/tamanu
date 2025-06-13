import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export const TimePickerField = ({ field, ...props }) => (
  <TimePicker name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
