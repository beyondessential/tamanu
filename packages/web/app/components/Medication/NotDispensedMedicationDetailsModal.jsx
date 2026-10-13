import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { BaseModal, Button, TranslatedReferenceData, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { Colors } from '../../constants/styles';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { MedicationDetailsColumns } from './MedicationDetailsColumns';

const Text = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
  margin-bottom: 16px;
`;

const ActionRow = styled(Box)`
  margin: 0 -32px -18px;
  padding: 20px 32px 20px 40px;
  border-top: 1px solid ${Colors.outline};
  display: flex;
  justify-content: flex-end;
`;

export const NotDispensedMedicationDetailsModal = ({ open, onClose, record }) => {
  const { formatShortest } = useDateTime();

  if (!record || !open) return null;

  const {
    pharmacyOrder,
    prescription,
    displayId,
    remainingRepeats,
    notDispensedReason,
    notDispensedAt,
  } = record;
  const patient = pharmacyOrder?.encounter?.patient;

  const leftDetails = [
    {
      label: (
        <TranslatedText stringId="medication.notDispensedDetails.patientId" fallback="Patient ID" />
      ),
      value: patient?.displayId || '-',
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
        <TranslatedText stringId="medication.notDispensedDetails.requestNo" fallback="Request no." />
      ),
      value: displayId || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensedDetails.reasonNotDispensed"
          fallback="Reason not dispensed"
        />
      ),
      value: notDispensedReason ? (
        <TranslatedReferenceData
          value={notDispensedReason.id}
          fallback={notDispensedReason.name}
          category="medicationNotDispensedReason"
        />
      ) : (
        '-'
      ),
    },
  ];

  const rightDetails = [
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
        <TranslatedText
          stringId="medication.notDispensedDetails.prescriptionDate"
          fallback="Prescription date"
        />
      ),
      value: prescription?.date ? formatShortest(trimToDate(prescription.date)) : '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensedDetails.remainingRepeats"
          fallback="Remaining repeats"
        />
      ),
      value: remainingRepeats ?? 0,
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
    <BaseModal
      open={open}
      width="sm"
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
      <Box mb={2.5}>
        <MedicationDetailsColumns leftDetails={leftDetails} rightDetails={rightDetails} />
      </Box>
      <ActionRow>
        <Button onClick={onClose}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      </ActionRow>
    </BaseModal>
  );
};
