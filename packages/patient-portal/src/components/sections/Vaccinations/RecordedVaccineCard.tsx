import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';

import type { AdministeredVaccine } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { formatDate, formatVaccineGivenBy, formatVaccineFacilityOrCountry } from '@utils/format';

interface RecordedVaccineCardProps {
  vaccine: AdministeredVaccine;
}

export const RecordedVaccineCard: React.FC<RecordedVaccineCardProps> = ({ vaccine }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h4">{vaccine.vaccineName || '--'}</Typography>
        <Typography>
          {vaccine.vaccineName || '--'} • {vaccine.date ? formatDate(vaccine.date) : '--'}
        </Typography>
        <Typography>
          Given by: {formatVaccineGivenBy(vaccine)} • {formatVaccineFacilityOrCountry(vaccine)}
        </Typography>
      </CardContent>
    </Card>
  );
};
