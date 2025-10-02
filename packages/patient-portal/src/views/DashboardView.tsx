import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useCurrentUser } from '@routes/PrivateRoute';
import { OutstandingFormsSection } from '../features/dashboard/OutstandingForms/OutstandingFormsSection';
import { UpcomingAppointmentsSection } from '../features/dashboard/Appointments/UpcomingAppointmentsSection';
import { PatientDetailsSection } from '../features/dashboard/PatientDetailsSection';
import { OngoingConditionsSection } from '../features/dashboard/OngoingConditionsSection';
import { AllergiesSection } from '../features/dashboard/AllergiesSection';
import { MedicationsSection } from '../features/dashboard/MedicationSection';
import { VaccinationsSection } from '../features/dashboard/Vaccinations/VaccinationsSection';
import { ProceduresSection } from '../features/dashboard/Procedures/ProceduresSection';

export const DashboardView = () => {
  const patient = useCurrentUser();

  const getPatientName = () => {
    if (!patient) return '';
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'there';
  };

  return (
    <Box>
      <Stack spacing={1.5}>
        <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 1, py: 1 }}>
          Hi {getPatientName()} 👋
        </Typography>
        <OutstandingFormsSection />
        <UpcomingAppointmentsSection />
        <PatientDetailsSection />
        <OngoingConditionsSection />
        <AllergiesSection />
        <ProceduresSection />
        <MedicationsSection />
        <VaccinationsSection />
      </Stack>
    </Box>
  );
};
