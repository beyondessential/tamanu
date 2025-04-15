import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { OngoingConditions } from './components/OngoingConditions';
import { Allergies } from './components/Allergies';
import { AppointmentsAccordion } from './components/AppointmentsAccordion';
import { MedicationsAccordion } from './components/MedicationsAccordion';
import { VaccinesAccordion } from './components/VaccinesAccordion';
import { PatientDetailsAccordion } from './components/PatientDetailsAccordion';
import { SurveyList } from './components/SurveyList';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';

const styles = {
  container: {
    maxWidth: '100%',
    padding: '16px',
    marginTop: '16px',
  },
  paper: {
    padding: '16px',
    marginBottom: '16px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
};

export const PatientPortal = () => {
  const { patientId, encounterId } = useParams();

  return (
    <Container sx={styles.container}>
      <Box sx={styles.header}>
        <Typography variant="h4" component="h1">
          Patient Portal
        </Typography>
      </Box>

      <SurveyList />

      <Paper sx={styles.paper}>
        <AppointmentsAccordion patientId={patientId} />
        <PatientDetailsAccordion patientId={patientId} />
        <OngoingConditions patientId={patientId} />
        <Allergies patientId={patientId} />
        <MedicationsAccordion patientId={patientId} />
        <VaccinesAccordion patientId={patientId} />
      </Paper>
    </Container>
  );
};
