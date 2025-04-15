// PatientDetailsAccordion.jsx
import React from 'react';
import { AccordionContainer } from './AccordionContainer';
import { Typography, Box, Grid2 } from '@mui/material';

const fields = [
  { label: 'First name', field: 'firstName' },
  { label: 'Last name', field: 'lastName' },
  { label: 'Date of birth', field: 'dob' },
  { label: 'Sex', field: 'sex' },
  { label: 'Village', field: 'village' },
  { label: 'Patient ID', field: 'patientId' },
];

// Sample data for testing
const sampleData = {
  firstName: 'John',
  lastName: 'Smith',
  dob: '1985-06-15',
  sex: 'Male',
  village: 'Seaside Village',
  patientId: 'P123456',
};

export const PatientDetailsAccordion = ({ data = sampleData }) => {
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
                {data[item.field] || '—'}
              </Typography>
            </Grid2>
          </Grid2>
        ))}
      </Box>
    </AccordionContainer>
  );
};
