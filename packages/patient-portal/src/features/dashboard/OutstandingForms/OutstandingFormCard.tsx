import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';

import type { PatientSurveyAssignment } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';

interface OutstandingFormCardProps {
  form: PatientSurveyAssignment;
  onClick?: () => void;
}

export const OutstandingFormCard: React.FC<OutstandingFormCardProps> = ({ form, onClick }) => {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} disabled={!onClick}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {form.survey.name}
              </Typography>
              <Box>
                <Chip
                  label={form.status === 'COMPLETED' ? 'Completed' : 'Outstanding'}
                  color={form.status === 'COMPLETED' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Stack>
            <ChevronRight size={20} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
