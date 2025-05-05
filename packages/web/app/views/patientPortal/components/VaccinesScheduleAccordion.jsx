// VaccineScheduleAccordion.jsx
import React from 'react';
import { Stack, Typography } from '@mui/material';
import { VaccineCard } from './VaccineCard';

const fakeVaccines = [
  {
    name: 'COVID-19 Vaccine',
    dose: 'Dose 1 of 2',
    dueDate: '2023-01-15',
    status: 'scheduled',
  },
  {
    name: 'Influenza Vaccine',
    dose: 'Annual',
    dueDate: '2023-03-20',
    status: 'upcoming',
  },
  {
    name: 'Tetanus Booster',
    dose: 'Booster',
    dueDate: '2023-06-10',
    status: 'overdue',
  },
];

export const VaccinesScheduleAccordion = ({ vaccines = fakeVaccines }) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h7">Vaccine Schedule ({vaccines.length})</Typography>
      {vaccines.map((vaccine, index) => (
        <VaccineCard
          key={index}
          vaccine={vaccine}
          elevation={0}
          rootSx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        />
      ))}
    </Stack>
  );
};
