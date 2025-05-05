import React from 'react';
import { Stack, Typography } from '@mui/material';
import { DetailCard } from './DetailCard';
import { useAdministeredVaccinesQuery } from '../../../api/queries';

const vaccineFields = [
  { label: 'Vaccine', field: 'name' },
  { label: 'Schedule', field: 'schedule' },
  { label: 'Date', field: 'date' },
  { label: 'Given By', field: 'givenBy' },
  { label: 'Facility', field: 'facility' },
];

export const RecordedVaccinesAccordion = ({ patientId }) => {
  const { data: administeredVaccines, isLoading } = useAdministeredVaccinesQuery(patientId);

  if (isLoading) return;

  const recordedVaccines =
    administeredVaccines?.data?.map(vaccine => ({
      name: vaccine.vaccineDisplayName,
      schedule: vaccine.scheduledVaccine?.doseLabel,
      date: vaccine.date?.split(' ')[0],
      givenBy: vaccine.recorder?.displayName,
      facility: vaccine.displayLocation,
    })) || [];

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
