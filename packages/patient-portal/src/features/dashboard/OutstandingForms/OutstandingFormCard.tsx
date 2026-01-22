import React from 'react';
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { Link as RouterLink } from 'react-router';
import type { PortalSurveyAssignment } from '@tamanu/shared/schemas/patientPortal';
import { Chip } from '@components/Chip';

interface OutstandingFormCardProps {
  form: PortalSurveyAssignment;
  onClick?: () => void;
}

export const OutstandingFormCard: React.FC<OutstandingFormCardProps> = ({ form }) => {
  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} to={`/survey/${form.survey.id}`}>
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
                      : 'To be completed'
                  }
                  color={
                    form.status === PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED ? 'green' : 'red'
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
