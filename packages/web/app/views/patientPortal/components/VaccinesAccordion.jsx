// VaccineScheduleAccordion.jsx
import React from 'react';
import { Stack } from '@mui/material';
import { AccordionContainer } from './AccordionContainer';
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

export const VaccinesAccordion = ({ vaccines = fakeVaccines }) => {
  return (
    <AccordionContainer title="Vaccine Schedule" count={vaccines.length} defaultExpanded={true}>
      <Stack spacing={2}>
        {vaccines.map((vaccine, index) => (
          <VaccineCard
            key={index}
            vaccine={vaccine}
            elevation={0}
            rootSx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          />
        ))}
      </Stack>
    </AccordionContainer>
  );
};
