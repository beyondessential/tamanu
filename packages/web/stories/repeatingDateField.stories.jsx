import React, { useState } from 'react';
import { startOfDay } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { RepeatingDateField } from '../app/components/Appointments/RepeatingDateField';
import Box from '@mui/material/Box';
import { Colors } from '../app/constants';

export default {
  title: 'Scheduling/RepeatingDateField',
  component: RepeatingDateField,
};

const Template = args => {
  const [value, setValue] = useState(startOfDay(new Date()));
  const handleChange = e => {
    setValue(e.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box width="312px" backgroundColor={Colors.background}>
        <RepeatingDateField {...args} value={value} onChange={handleChange} />
      </Box>
    </LocalizationProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};
