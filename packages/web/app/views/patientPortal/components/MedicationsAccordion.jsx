// MedicationsAccordion.jsx
import React from 'react';
import { Stack } from '@mui/material';
import { AccordionContainer } from './AccordionContainer';
import { DetailCard } from './DetailCard';
import { useEncounterMedicationsQuery } from '../../../api/queries/useEncounterMedicationsQuery';

const medicationFields = [
  { label: 'Medication', field: 'medication' },
  { label: 'Dose', field: 'dose' },
  { label: 'Frequency', field: 'frequency' },
  { label: 'Route', field: 'route' },
  { label: 'Date', field: 'date' },
  { label: 'Prescriber', field: 'prescriber' },
];

const mockMedications = [
  {
    medication: 'Amoxicillin',
    dose: '500mg',
    frequency: 'Three times daily',
    route: 'Oral',
    date: '2023-10-15',
    prescriber: 'Dr. Smith',
  },
  {
    medication: 'Ibuprofen',
    dose: '400mg',
    frequency: 'As needed',
    route: 'Oral',
    date: '2023-10-14',
    prescriber: 'Dr. Jones',
  },
  {
    medication: 'Ventolin',
    dose: '100mcg',
    frequency: 'Two puffs when required',
    route: 'Inhaled',
    date: '2023-10-10',
    prescriber: 'Dr. Wilson',
  },
];

export const MedicationsAccordion = ({ encounterId, medications = mockMedications }) => {
  console.log(encounterId);
  const { data: encounterMedications } = useEncounterMedicationsQuery(encounterId);
  console.log('medications', encounterMedications);

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
