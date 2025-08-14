import { VACCINE_STATUS } from '@tamanu/constants';

import React from 'react';
import { Box, styled, Typography, Chip, Card, CardContent } from '@mui/material';
import type { UpcomingVaccination } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { formatWeekOf, getVaccineStatusColor } from '@utils/format';

interface UpcomingVaccineCardProps {
  vaccine: UpcomingVaccination;
}

const DetailsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

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
