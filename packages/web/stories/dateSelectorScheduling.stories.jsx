import React, { useState } from 'react';
import { DateSelector } from '../app/views/scheduling/DateSelector';
import { startOfDay } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MonthYearInput } from '../app/components';

export default {
  argTypes: {},
  title: 'SchedulingDateSelector',
  component: DateSelector,
};

const Template = args => {
  const [value, setValue] = useState(startOfDay(new Date()));
  const handleChange = e => {
    setValue(startOfDay(e.target.value));
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MonthYearInput value={value} onChange={handleChange} />
      <DateSelector {...args} value={value} onChange={handleChange} />
    </LocalizationProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};
