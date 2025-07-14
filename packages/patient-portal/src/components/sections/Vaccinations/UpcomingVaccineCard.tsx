import React from 'react';
import { Box, styled, Typography, Chip, Card, CardContent } from '@mui/material';
import type { UpcomingVaccine } from '@tamanu/shared/schemas/responses/upcomingVaccine.schema';
import { formatWeekOf, getVaccineStatusColor } from '../../../utils/format';

const DetailsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

interface UpcomingVaccineCardProps {
  vaccine: UpcomingVaccine;
}

export const UpcomingVaccineCard: React.FC<UpcomingVaccineCardProps> = ({ vaccine }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h4">{vaccine.label || 'Unknown vaccine'}</Typography>
        <DetailsContainer>
          <Typography variant="body1">
            {vaccine.scheduleName || 'Unknown dose'} • {formatWeekOf(vaccine.dueDate)}
          </Typography>
          <Chip
            label={vaccine.status || '--'}
            color={getVaccineStatusColor(vaccine.status || '')}
            size="small"
          />
        </DetailsContainer>
      </CardContent>
    </Card>
  );
};
