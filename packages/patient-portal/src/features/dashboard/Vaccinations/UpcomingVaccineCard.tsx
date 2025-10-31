import React from 'react';
import { VACCINE_STATUS } from '@tamanu/constants';
import { Box, styled, Typography, Card, CardContent } from '@mui/material';
import type {
  AdministeredVaccine,
  UpcomingVaccination,
} from '@tamanu/shared/schemas/patientPortal';
import { formatWeekOf } from '@utils/format';
import { Chip } from '@components/Chip';

interface UpcomingVaccineCardProps {
  vaccine: UpcomingVaccination;
}

const DetailsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

const getVaccineStatusColor = (status: AdministeredVaccine['status']) => {
  switch (status) {
    case 'SCHEDULED':
      return 'purple';
    case 'UPCOMING':
      return 'blue';
    case 'DUE':
      return 'green';
    case 'OVERDUE':
      return 'orange';
    case 'MISSED':
      return 'red';
    default:
      return 'blue';
  }
};

export const UpcomingVaccineCard: React.FC<UpcomingVaccineCardProps> = ({ vaccine }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h4">{vaccine.scheduledVaccine.label || 'Unknown vaccine'}</Typography>
        <DetailsContainer>
          <Typography variant="body1">
            {vaccine.scheduledVaccine.doseLabel || 'Unknown dose'} • {formatWeekOf(vaccine.dueDate)}
          </Typography>
          <Chip
            label={vaccine.status}
            color={getVaccineStatusColor(vaccine.status as keyof typeof VACCINE_STATUS)}
            size="small"
            sx={{ width: 'fit-content' }}
          />
        </DetailsContainer>
      </CardContent>
    </Card>
  );
};
