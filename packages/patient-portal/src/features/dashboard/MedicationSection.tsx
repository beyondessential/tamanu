import React from 'react';
import { AccordionSection } from '../../components/AccordionSection';
import { Box, styled, Typography, Card, CardContent } from '@mui/material';
import { Pill } from 'lucide-react';
import { useMedicationsQuery } from '@api/queries/useMedicationsQuery';
import { LabelValueList } from '../../components/LabelValueList';
import { StyledCircularProgress } from '../../components/StyledCircularProgress';
import {
  formatDose,
  formatFrequency,
  formatRoute,
  formatPrescriber,
} from '@utils/format';
import { useDateTimeFormat } from '@tamanu/ui-components';

const MedicationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
}));

export const MedicationsSection = () => {
  const { formatShort } = useDateTimeFormat();
  const { data: medications, isLoading } = useMedicationsQuery();

  return (
    <AccordionSection header="Medications" icon={<Pill />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : medications && medications.length > 0 ? (
        <MedicationContainer>
          {medications.map(medication => (
            <Card key={medication.id}>
              <CardContent>
                <LabelValueList>
                  <LabelValueList.ListItem
                    label="Medication"
                    value={medication.medication?.name || '--'}
                  />
                  <LabelValueList.ListItem
                    label="Dose"
                    value={formatDose(medication.doseAmount, medication.units || undefined)}
                  />
                  <LabelValueList.ListItem
                    label="Frequency"
                    value={formatFrequency(medication.frequency || undefined)}
                  />
                  <LabelValueList.ListItem
                    label="Route"
                    value={formatRoute(medication.route || undefined)}
                  />
                  <LabelValueList.ListItem
                    label="Start Date"
                    value={formatShort(medication.startDate)}
                  />
                  <LabelValueList.ListItem
                    label="Prescriber"
                    value={formatPrescriber(medication.prescriber)}
                  />
                </LabelValueList>
              </CardContent>
            </Card>
          ))}
        </MedicationContainer>
      ) : (
        <Typography color="text.secondary">No medications recorded.</Typography>
      )}
    </AccordionSection>
  );
};
