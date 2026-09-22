import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { BaseModal, Button, TranslatedReferenceData, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { Colors } from '../../constants/styles';
import { PatientNameDisplay } from '../PatientNameDisplay';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const Text = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
  margin-bottom: 16px;
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
  margin: 20px -32px -8px;
  padding: 20px 40px 0 40px;
  border-top: 1px solid ${Colors.outline};
  display: flex;
  justify-content: flex-end;
`;

export const NotDispensedMedicationDetailsModal = ({ open, onClose, record }) => {
  const { formatShortest } = useDateTime();

  if (!record || !open) return null;

  const { pharmacyOrder, prescription, displayId, repeats, notDispensedReason, notDispensedAt } = record;
  const patient = pharmacyOrder?.encounter?.patient;

  const details = [
    {
      label: (
        <TranslatedText stringId="medication.notDispensedDetails.patientId" fallback="Patient ID" />
      ),
      value: patient?.displayId || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensedDetails.patientName"
          fallback="Patient name"
        />
      ),
      value: patient ? <PatientNameDisplay patient={patient} /> : '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.notDispensedDetails.medication" fallback="Medication" />
      ),
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
        <TranslatedText
          stringId="medication.notDispensedDetails.prescriptionDate"
          fallback="Prescription date"
        />
      ),
      value: prescription?.date ? formatShortest(trimToDate(prescription.date)) : '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.notDispensedDetails.requestNo" fallback="Request no." />
      ),
      value: displayId || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensedDetails.remainingRepeats"
          fallback="Remaining repeats"
        />
      ),
      value: repeats ?? 0,
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensedDetails.reasonNotDispensed"
          fallback="Reason not dispensed"
        />
      ),
      value: notDispensedReason?.name || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensedDetails.dateNotDispensed"
          fallback="Date not dispensed"
        />
      ),
      value: notDispensedAt ? formatShortest(trimToDate(notDispensedAt)) : '-',
    },
  ];

  return (
    <StyledModal
      open={open}
      title={
        <TranslatedText
          stringId="medication.notDispensedDetails.title"
          fallback="Not dispensed medication"
        />
      }
      onClose={onClose}
    >
      <Text>
        <TranslatedText
          stringId="medication.notDispensedDetails.text"
          fallback="The below medication was marked as not dispensed."
        />
      </Text>
      <DetailsContainer>
        {details.map((detail, index) => (
          <Box key={index} mb={index === details.length - 1 ? 0 : 2}>
            <MidText>{detail.label}</MidText>
            <DarkestText mt={0.5}>{detail.value}</DarkestText>
          </Box>
        ))}
      </DetailsContainer>
      <ActionRow>
        <Button onClick={onClose}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      </ActionRow>
    </StyledModal>
  );
};
