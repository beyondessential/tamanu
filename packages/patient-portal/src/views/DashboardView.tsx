import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

import { usePatientQuery } from '@api/queries/usePatientQuery';
import { StyledCircularProgress } from '../components/StyledCircularProgress';

// Section imports
import { OutstandingFormsSection } from '../components/sections/Forms/OutstandingFormsSection';
import { UpcomingAppointmentsSection } from '../components/sections/Appointments/UpcomingAppointmentsSection';
import { PatientDetailsSection } from '../components/sections/PatientDetailsSection';
import { OngoingConditionsSection } from '../components/sections/OngoingConditionsSection';
import { AllergiesSection } from '../components/sections/AllergiesSection';
import { MedicationsSection } from '../components/sections/MedicationSection';
import { VaccinationsSection } from '../components/sections/Vaccinations/VaccinationsSection';

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
