import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { formatShortest } from '@tamanu/utils/dateTime';
import { BaseModal, Button, TranslatedReferenceData, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { PatientNameDisplay } from '../PatientNameDisplay';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 620px;
  }
`;

const Container = styled.div`
  padding: 22px 8px 40px;
`;

const DetailsContainer = styled(Box)`
  padding: 12px 20px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
`;

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const ActionRow = styled(Box)`
  margin: 0 -32px -8px;
  padding: 20px 40px 0 40px;
  border-top: 1px solid ${Colors.outline};
  display: flex;
  justify-content: flex-end;
`;

export const DispensedMedicationDetailsModal = ({ open, onClose, item }) => {
  if (!item || !open) return null;

  const {
    prescription,
    quantity,
    instructions,
    displayId,
    dispensedAt,
    dispensedBy,
    patient,
  } = item;

  const leftDetails = [
    {
      label: <TranslatedText stringId="medication.dispenseDetails.patientId" fallback="Patient ID" />,
      value: patient?.displayId || '-',
    },
    {
      label: <TranslatedText stringId="medication.dispenseDetails.medication" fallback="Medication" />,
      value: (
        <TranslatedReferenceData
          fallback={prescription?.medication?.name}
          value={prescription?.medication?.id}
          category={prescription?.medication?.type}
        />
      ),
    },
    {
      label: (
        <TranslatedText stringId="medication.dispenseDetails.dateDispensed" fallback="Date dispensed" />
      ),
      value: dispensedAt ? formatShortest(dispensedAt) : '-',
    },
    {
      label: <TranslatedText stringId="medication.dispenseDetails.dispensedBy" fallback="Dispensed by" />,
      value: dispensedBy?.displayName || '-',
    },
    {
      label: <TranslatedText stringId="medication.dispenseDetails.instructions" fallback="Instructions" />,
      value: instructions || '-',
    },
  ];

  const rightDetails = [
    {
      label: <TranslatedText stringId="medication.dispenseDetails.patientName" fallback="Patient name" />,
      value: patient ? <PatientNameDisplay patient={patient} /> : '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.dispenseDetails.prescriptionDate"
          fallback="Prescription date"
        />
      ),
      value: prescription?.date ? formatShortest(prescription.date) : '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.dispenseDetails.qtyDispensed" fallback="Qty dispensed" />
      ),
      value: quantity ?? '-',
    },
    {
      label: <TranslatedText stringId="medication.dispenseDetails.requestNo" fallback="Request no." />,
      value: displayId || '-',
    },
  ];

  return (
    <StyledModal
      open={open}
      title={
        <TranslatedText stringId="medication.dispenseDetails.title" fallback="Dispensed medication" />
      }
      onClose={onClose}
    >
      <Container>
        <DetailsContainer display="flex" justifyContent="space-between">
          <Box flex={1.1}>
            {leftDetails.map((detail, index) => (
              <Box key={index} mb={index === leftDetails.length - 1 ? 0 : 2}>
                <MidText>{detail.label}</MidText>
                <DarkestText mt={0.5}>{detail.value}</DarkestText>
              </Box>
            ))}
          </Box>
          <Box flex={1} pl={2.5} borderLeft={`1px solid ${Colors.outline}`}>
            {rightDetails.map((detail, index) => (
              <Box key={index} mb={index === rightDetails.length - 1 ? 0 : 2}>
                <MidText>{detail.label}</MidText>
                <DarkestText mt={0.5}>{detail.value}</DarkestText>
              </Box>
            ))}
          </Box>
        </DetailsContainer>
      </Container>

      <ActionRow>
        <Button onClick={onClose}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      </ActionRow>
    </StyledModal>
  );
};
