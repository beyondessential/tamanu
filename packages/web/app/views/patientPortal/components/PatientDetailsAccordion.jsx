// PatientDetailsAccordion.jsx
import React from 'react';
import { AccordionContainer } from './AccordionContainer';
import { Typography, Box, Grid2 } from '@mui/material';
import { useReferenceDataQuery } from '../../../api/queries';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';
import { getSex } from '@tamanu/shared/utils/patientAccessors';

const fields = [
  { label: 'First name', field: 'firstName' },
  { label: 'Last name', field: 'lastName' },
  { label: 'Date of birth', field: 'dateOfBirth' },
  { label: 'Sex', field: 'sex' },
  { label: 'Village', field: 'village' },
  { label: 'Patient ID', field: 'displayId' },
];

export const PatientDetailsAccordion = ({ patientId }) => {
  const { data: patient, isLoading: isPatientDataLoading } = usePatientDataQuery(patientId);
  const { data: village, isLoading: isVillageLoading } = useReferenceDataQuery(patient?.villageId);

  if (isPatientDataLoading || isVillageLoading) return;

  const patientDetails = {
    ...patient,
    sex: getSex(patient),
    village: village.name,
  };

  console.log('Patient Details:', patientDetails);

  return (
    <AccordionContainer title="Patient details" defaultExpanded>
      <Box>
        {fields.map((item, index) => (
          <Grid2 container key={index} sx={{ py: 0.5 }}>
            <Grid2 item xs={4} sx={{ width: '150px', flexShrink: 0 }}>
              <Typography color="text.secondary" variant="body2">
                {item.label}
              </Typography>
            </Grid2>
            <Grid2 item xs={8}>
              <Typography variant="body1" fontWeight="medium">
                {patientDetails[item.field] || '—'}
              </Typography>
            </Grid2>
          </Grid2>
        ))}
      </Box>
    </AccordionContainer>
  );
};
