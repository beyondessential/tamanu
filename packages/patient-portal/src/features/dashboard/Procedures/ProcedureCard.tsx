import React from 'react';
import { Box, styled, Typography, Card, CardContent } from '@mui/material';
import type { Procedure } from '@tamanu/shared/schemas/patientPortal/responses/procedure.schema';
import { Chip } from '@components/Chip';

interface ProcedureCardProps {
  procedure: Procedure;
}

const Content = styled(CardContent)({
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  paddingBottom: '12px !important',
});

export const ProcedureCard: React.FC<ProcedureCardProps> = ({ procedure }) => {
  return (
    <Card variant="outlined">
      <Content>
        <Box>
          <Typography variant="h4" sx={{ mb: '5px' }}>
            {procedure?.procedureType?.name || 'Unknown procedure'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: '2px' }}>
            {procedure.date}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {procedure?.leadClinician?.displayName || 'Unknown clinician'}
          </Typography>
        </Box>
        {procedure.completed ? (
          <Chip label="Completed" color="blue" size="small" />
        ) : (
          <Chip label="Planned" color="green" size="small" />
        )}
      </Content>
    </Card>
  );
};
