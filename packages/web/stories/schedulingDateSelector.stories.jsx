import React, { useState } from 'react';
import { startOfDay } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateSelector } from '../app/views/scheduling/outpatientBookings/DateSelector';

export default {
  title: 'Scheduling/DateSelector',
  component: DateSelector,
};

const Template = args => {
  const [value, setValue] = useState(startOfDay(new Date()));
  const handleChange = e => {
    setValue(e.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateSelector {...args} value={value} onChange={handleChange} />
    </LocalizationProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};
