import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';

import type { AdministeredVaccine } from '@tamanu/shared/schemas/patientPortal';
import { formatVaccineGivenBy, formatVaccineFacilityOrCountry } from '@utils/format';
import { useDateTimeFormat } from '@tamanu/ui-components';

interface RecordedVaccineCardProps {
  vaccine: AdministeredVaccine;
}

export const RecordedVaccineCard: React.FC<RecordedVaccineCardProps> = ({ vaccine }) => {
  const { formatShort } = useDateTimeFormat();
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h4">{vaccine.scheduledVaccine?.label || '--'}</Typography>
        <Typography>
          {vaccine.scheduledVaccine?.doseLabel || '--'} •{' '}
          {vaccine.date ? formatShort(vaccine.date) : '--'}
        </Typography>
        <Typography>Given by: {formatVaccineGivenBy(vaccine)}</Typography>
        <Typography>Facility / Country: {formatVaccineFacilityOrCountry(vaccine)}</Typography>
      </CardContent>
    </Card>
  );
};
