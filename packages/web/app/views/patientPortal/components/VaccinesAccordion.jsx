import React from 'react';
import { Stack } from '@mui/material';
import { AccordionContainer } from './AccordionContainer';
import { RecordedVaccinesAccordion } from './RecordedVaccinesAccordion';
import { VaccinesScheduleAccordion } from './VaccinesScheduleAccordion';

export const VaccinesAccordion = ({ patientId }) => {
  return (
    <AccordionContainer title="Vaccines" count={2} defaultExpanded={true}>
      <Stack spacing={2}>
        <RecordedVaccinesAccordion patientId={patientId} />
        <VaccinesScheduleAccordion patientId={patientId} />
      </Stack>
    </AccordionContainer>
  );
};
