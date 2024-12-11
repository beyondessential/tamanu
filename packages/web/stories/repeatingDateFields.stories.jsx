import React, { useState } from 'react';
import { parseISO, startOfDay } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { RepeatingDateFields } from '../app/components/Appointments/OutpatientsBookingForm/RepeatingDateFields';
import Box from '@mui/material/Box';
import { Colors } from '../app/constants';
import { DateInput } from '../app/components';

export default {
  title: 'Scheduling/RepeatingDateFields',
  component: RepeatingDateFields,
};

const Template = args => {
  const [value, setValue] = useState(startOfDay(new Date('2024-11-24')));
  console.log(value);
  const handleChange = e => {
    setValue(startOfDay(parseISO(e.target.value)));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box width="312px" backgroundColor={Colors.background}>
        <RepeatingDateFields {...args} value={value} onChange={handleChange} />
      </Box>
      <Box width="200px" mt={3}>
        <DateInput label="Base date" saveDateAsString value={value} onChange={handleChange} />
      </Box>
    </LocalizationProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};
