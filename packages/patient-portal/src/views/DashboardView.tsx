import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

import { usePatientQuery } from '@api/queries/usePatientQuery';
import { StyledCircularProgress } from '../components/StyledCircularProgress';

// Section imports
import { OutstandingFormsSection } from '../features/dashboard/OutstandingForms/OutstandingFormsSection';
import { UpcomingAppointmentsSection } from '../features/dashboard/Appointments/UpcomingAppointmentsSection';
import { PatientDetailsSection } from '../features/dashboard/PatientDetailsSection';
import { OngoingConditionsSection } from '../features/dashboard/OngoingConditionsSection';
import { AllergiesSection } from '../features/dashboard/AllergiesSection';
import { MedicationsSection } from '../features/dashboard/MedicationSection';
import { VaccinationsSection } from '../features/dashboard/Vaccinations/VaccinationsSection';

export const DashboardView = () => {
  const { data: patient, isLoading } = usePatientQuery();

  // Format patient name
  const getPatientName = () => {
    if (!patient) return '';
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'there';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <StyledCircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {/* Header */}
        <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 1, py: 1 }}>
          Hi {getPatientName()} 👋
        </Typography>

        {/* Sections */}
        <OutstandingFormsSection />
        <UpcomingAppointmentsSection />
        <PatientDetailsSection />
        <OngoingConditionsSection />
        <AllergiesSection />
        <MedicationsSection />
        <VaccinationsSection />
      </Stack>
    </Box>
  );
};
