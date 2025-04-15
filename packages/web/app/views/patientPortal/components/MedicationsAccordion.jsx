// MedicationsAccordion.jsx
import React from 'react';
import { Stack } from '@mui/material';
import { AccordionContainer } from './AccordionContainer';
import { DetailCard } from './DetailCard';
import { useEncounterMedicationsQuery } from '../../../api/queries/useEncounterMedicationsQuery';

const medicationFields = [
  { label: 'Medication', field: 'name' },
  { label: 'Dose', field: 'dose' },
  { label: 'Frequency', field: 'frequency' },
  { label: 'Route', field: 'route' },
  { label: 'Date', field: 'date' },
  { label: 'Prescriber', field: 'prescriber' },
];

export const MedicationsAccordion = ({ encounterId }) => {
  const { data: encounterMedications, isLoading } = useEncounterMedicationsQuery(encounterId);

  if (isLoading) return;

  const medications =
    encounterMedications?.data?.map(med => ({
      name: med.medication?.name,
      dose: med.prescription,
      frequency: `${med.qtyMorning}-${med.qtyLunch}-${med.qtyEvening}-${med.qtyNight}`,
      route: med.route,
      date: med.date,
      prescriber: med.prescriber?.displayName,
    })) || [];

  return (
    <AccordionContainer title="Medications" count={medications.length} defaultExpanded={true}>
      <Stack spacing={2}>
        {medications.map((medication, index) => (
          <DetailCard
            key={index}
            items={medicationFields}
            data={medication}
            elevation={0}
            rootSx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          />
        ))}
      </Stack>
    </AccordionContainer>
  );
};
