import React from 'react';
import { Box, styled, Typography, Chip } from '@mui/material';

import { Card } from '../../Card';
import type { UpcomingVaccine } from '@tamanu/shared/dtos/responses/UpcomingVaccineSchema';
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
      <Typography variant="h4">{vaccine.scheduledVaccine?.label || 'Unknown vaccine'}</Typography>
      <DetailsContainer>
        <Typography variant="body1">
          {vaccine.scheduledVaccine?.doseLabel || 'Unknown dose'} • {formatWeekOf(vaccine.dueDate)}
        </Typography>
        <Chip
          label={vaccine.status || '--'}
          color={getVaccineStatusColor(vaccine.status || '')}
          size="small"
        />
      </DetailsContainer>
    </Card>
  );
};
