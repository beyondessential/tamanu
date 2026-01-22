import React from 'react';
import { Stack, Typography } from '@mui/material';
import { HeartPulse } from 'lucide-react';
import { AccordionSection } from '../../../components/AccordionSection';
import { StyledCircularProgress } from '../../../components/StyledCircularProgress';
import { useProceduresQuery } from '@api/queries/useProceduresQuery';
import { ProcedureCard } from './ProcedureCard';

export const ProceduresSection = () => {
  const { data: procedures, isLoading } = useProceduresQuery();

  const plannedProcedures = procedures?.filter(procedure => !procedure.completed) || [];
  const completedProcedures = procedures?.filter(procedure => procedure.completed) || [];

  return (
    <AccordionSection header="Procedures" icon={<HeartPulse />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : (
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Planned procedures
            </Typography>
            {plannedProcedures.length > 0 ? (
              <Stack spacing={2}>
                {plannedProcedures.map(procedure => (
                  <ProcedureCard key={procedure.id} procedure={procedure} />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No procedures to display.</Typography>
            )}
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Completed procedures
            </Typography>
            {completedProcedures.length > 0 ? (
              <Stack spacing={2}>
                {completedProcedures.map(procedure => (
                  <ProcedureCard key={procedure.id} procedure={procedure} />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No procedures to display.</Typography>
            )}
          </Stack>
        </Stack>
      )}
    </AccordionSection>
  );
};
