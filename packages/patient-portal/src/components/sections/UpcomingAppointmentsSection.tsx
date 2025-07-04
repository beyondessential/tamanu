import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Calendar } from 'lucide-react';

import { StyledCircularProgress } from '../StyledCircularProgress';
import { AppointmentCard } from '../AppointmentCard';
import { useUpcomingAppointmentsQuery } from '../../api/queries/useUpcomingAppointmentsQuery';
import { TAMANU_COLORS } from '@tamanu/shared/ui/theme/colors';
import { Card } from '../Card';

export const UpcomingAppointmentsSection = () => {
  const { data: appointments, isLoading } = useUpcomingAppointmentsQuery();

  const appointmentCount = appointments?.length || 0;

  return (
    <Card variant="outlined">
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calendar size={24} color={TAMANU_COLORS.purple} />
          <Typography variant="h4" fontWeight="normal">
            You have{' '}
            <Typography
              component="span"
              variant="h4"
              sx={{ textDecoration: 'underline', fontWeight: 'bold' }}
            >
              {appointmentCount}
            </Typography>{' '}
            upcoming {appointmentCount === 1 ? 'appointment' : 'appointments'}
          </Typography>
        </Box>

        {/* Content */}
        {isLoading ? (
          <StyledCircularProgress size={24} />
        ) : appointments && appointments.length > 0 ? (
          <Stack spacing={2}>
            {appointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">No upcoming appointments scheduled.</Typography>
        )}
      </Stack>
    </Card>
  );
};
