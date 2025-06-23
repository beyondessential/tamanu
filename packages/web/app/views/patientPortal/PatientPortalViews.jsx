import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

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

export const PatientPortalViews = () => {
  return (
    <Container sx={styles.container}>
      <Box sx={styles.header}>
        <Typography variant="h4" component="h1">
          Patient Portal
        </Typography>
      </Box>

      <Paper sx={styles.paper}>Patient Portal Views.</Paper>
    </Container>
  );
};
