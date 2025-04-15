import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import OngoingConditions from './components/OngoingConditions';
import Allergies from './components/Allergies';

const PatientPortal = () => {
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

  return (
    <Container sx={styles.container}>
      <Box sx={styles.header}>
        <Typography variant="h4" component="h1">
          Patient Portal
        </Typography>
      </Box>

      <Paper sx={styles.paper}>
        <OngoingConditions patientId="19324abf-b485-4184-8537-0a7fe4be1d0b" />
        <Allergies patientId="19324abf-b485-4184-8537-0a7fe4be1d0b" />
        <Typography variant="h6" gutterBottom>
          Personal Information
        </Typography>
        {/* Add patient information here */}
      </Paper>

      <Paper sx={styles.paper}>
        <Typography variant="h6" gutterBottom>
          Upcoming Appointments
        </Typography>
        {/* Add appointments list here */}
      </Paper>

      <Paper sx={styles.paper}>
        <Typography variant="h6" gutterBottom>
          Recent Medical Records
        </Typography>
        {/* Add medical records summary here */}
      </Paper>

      <Paper sx={styles.paper}>
        <Typography variant="h6" gutterBottom>
          Medications
        </Typography>
        {/* Add medications list here */}
      </Paper>
    </Container>
  );
};

export default PatientPortal;
