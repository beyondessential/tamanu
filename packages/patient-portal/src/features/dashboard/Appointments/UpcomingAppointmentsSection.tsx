import React from 'react';
import { Stack, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { Calendar } from 'lucide-react';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { StyledCircularProgress } from '../../../components/StyledCircularProgress';
import { AppointmentCard } from './AppointmentCard';
import { useUpcomingAppointmentsQuery } from '@api/queries/useUpcomingAppointmentsQuery';

export const UpcomingAppointmentsSection = () => {
  const { data: appointments, isLoading } = useUpcomingAppointmentsQuery();

  const appointmentCount = appointments?.length || 0;

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={<Calendar size={24} color={TAMANU_COLORS.purple} />}
        title={
          <Typography variant="h4" fontWeight="normal">
            You have{' '}
            {appointmentCount ? (
              <Typography
                component="span"
                variant="h4"
                sx={{ textDecoration: 'underline', fontWeight: 'bold' }}
              >
                {appointmentCount}
              </Typography>
            ) : (
              'no'
            )}{' '}
            upcoming {appointmentCount === 1 ? 'appointment' : 'appointments'}
          </Typography>
        }
      />

      {isLoading ? (
        <CardContent>
          <StyledCircularProgress size={24} />
        </CardContent>
      ) : appointments && appointments.length > 0 ? (
        <CardContent>
          <Stack spacing={2}>
            {appointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </Stack>
        </CardContent>
      ) : null}
    </Card>
  );
};
