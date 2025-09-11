import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';

import type { PortalSurveyAssignment } from '@tamanu/shared/schemas/patientPortal';

interface OutstandingFormCardProps {
  form: PortalSurveyAssignment;
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
                  label={
                    form.status === PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED
                      ? 'Completed'
                      : 'Outstanding'
                  }
                  color={
                    form.status === PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED
                      ? 'success'
                      : 'warning'
                  }
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
