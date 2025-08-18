import React from 'react';
import { Stack, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { Calendar } from 'lucide-react';
import { TAMANU_COLORS } from '@tamanu/shared/ui/colors';
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
            <Typography
              component="span"
              variant="h4"
              sx={{ textDecoration: 'underline', fontWeight: 'bold' }}
            >
              {appointmentCount || 'no'}
            </Typography>{' '}
            upcoming {appointmentCount === 1 ? 'appointment' : 'appointments'}
          </Typography>
        }
      />

      <CardContent>
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
      </CardContent>
    </Card>
  );
};
