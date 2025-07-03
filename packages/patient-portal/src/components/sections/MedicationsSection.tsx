import React from 'react';
import { AccordionSection } from '../AccordionSection';
import { Box, styled, Typography } from '@mui/material';
import { Pill } from 'lucide-react';

import { useMedicationsQuery } from '../../api/queries/useMedicationsQuery';
import { LabelValueList } from '../LabelValueList';
import { Card } from '../Card';
import { StyledCircularProgress } from '../StyledCircularProgress';
import {
  formatDate,
  formatDose,
  formatFrequency,
  formatRoute,
  formatPrescriber,
} from '../../utils/format';

const MedicationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
}));

export const MedicationsSection = () => {
  const { data: medications, isLoading } = useMedicationsQuery();

  return (
    <AccordionSection header="Medications" icon={<Pill />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : medications && medications.length > 0 ? (
        <MedicationContainer>
          {medications.map(medication => (
            <Card key={medication.id}>
              <LabelValueList>
                <LabelValueList.ListItem
                  label="Medication"
                  value={medication.medication?.name || '--'}
                />
                <LabelValueList.ListItem
                  label="Dose"
                  value={formatDose(medication.doseAmount, medication.units)}
                />
                <LabelValueList.ListItem
                  label="Frequency"
                  value={formatFrequency(medication.frequency)}
                />
                <LabelValueList.ListItem label="Route" value={formatRoute(medication.route)} />
                <LabelValueList.ListItem label="Date" value={formatDate(medication.date)} />
                <LabelValueList.ListItem
                  label="Prescriber"
                  value={formatPrescriber(medication.prescriber)}
                />
              </LabelValueList>
            </Card>
          ))}
        </MedicationContainer>
      ) : (
        <Typography color="text.secondary">No medications recorded.</Typography>
      )}
    </AccordionSection>
  );
};
