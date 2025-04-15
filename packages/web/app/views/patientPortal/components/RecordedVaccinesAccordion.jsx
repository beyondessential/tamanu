import React from 'react';
import { Stack, Typography } from '@mui/material';
import { DetailCard } from './DetailCard';

const vaccineFields = [
  { label: 'Vaccine', field: 'vaccine' },
  { label: 'Schedule', field: 'schedule' },
  { label: 'Date', field: 'date' },
  { label: 'Given By', field: 'givenBy' },
  { label: 'Facility', field: 'facility' },
];

const mockVaccines = [
  {
    vaccine: 'COVID-19 (Pfizer)',
    schedule: 'Dose 1 of 2',
    date: '2023-05-15',
    givenBy: 'Dr. Smith',
    facility: 'Central Hospital, Fiji',
  },
  {
    vaccine: 'Tetanus',
    schedule: 'Booster',
    date: '2023-01-20',
    givenBy: 'Dr. Jones',
    facility: 'Medical Center, Samoa',
  },
  {
    vaccine: 'Hepatitis B',
    schedule: 'Dose 3 of 3',
    date: '2022-12-10',
    givenBy: 'Dr. Wilson',
    facility: 'Community Clinic, Tonga',
  },
];

export const RecordedVaccinesAccordion = ({ recordedVaccines = mockVaccines }) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h7">Recorded vaccines ({recordedVaccines.length})</Typography>
      {recordedVaccines.map((vaccine, index) => (
        <DetailCard
          key={index}
          items={vaccineFields}
          data={vaccine}
          elevation={0}
          rootSx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        />
      ))}
    </Stack>
  );
};
