import React from 'react';
import { Typography } from '@mui/material';

import { Card } from '../../Card';
import type { AdministeredVaccine } from '@tamanu/shared/dtos/responses/AdministeredVaccineSchema';
import {
  formatDate,
  formatVaccineGivenBy,
  formatVaccineFacilityOrCountry,
} from '../../../utils/format';

interface RecordedVaccineCardProps {
  vaccine: AdministeredVaccine;
}

export const RecordedVaccineCard: React.FC<RecordedVaccineCardProps> = ({ vaccine }) => {
  return (
    <Card variant="outlined">
      <Typography variant="h4">{vaccine.scheduledVaccine?.label || '--'}</Typography>
      <Typography>
        {vaccine.scheduledVaccine?.doseLabel || '--'} •{' '}
        {vaccine.date ? formatDate(vaccine.date) : '--'}
      </Typography>
      <Typography>
        Given by: {formatVaccineGivenBy({ ...vaccine, status: vaccine.status || 'UNKNOWN' })}
      </Typography>
      <Typography>Facility / Country: {formatVaccineFacilityOrCountry(vaccine)}</Typography>
    </Card>
  );
};
