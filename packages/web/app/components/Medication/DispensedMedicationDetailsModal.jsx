import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import {
  BaseModal,
  Button,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { Colors } from '../../constants/styles';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { useTranslation } from '../../contexts/Translation';
import { useAuth } from '../../contexts/Auth';
import { getDrugUnitLabel } from '@tamanu/shared/utils/medication';
import {
  buildInstructionText,
  PharmacyPrescriptionTypeLabel,
  usePresetLabelsQuery,
} from '../../utils/medications';
import { MedicationDetailsColumns } from './MedicationDetailsColumns';

const StyledModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 620px;
  }
`;

const Container = styled.div`
  padding: 22px 8px 40px;
`;

const ActionRow = styled(Box)`
  margin: 0 -32px -8px;
  padding: 20px 40px 0 40px;
  border-top: 1px solid ${Colors.outline};
  display: flex;
  justify-content: flex-end;
`;

export const DispensedMedicationDetailsModal = ({ open, onClose, item }) => {
  const { formatShortest } = useDateTime();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const { facilityId } = useAuth();
  const { hasPresetLabels } = usePresetLabelsQuery({ enabled: open, facilityId });
  if (!item || !open) return null;

  const {
    prescription,
    quantity,
    instructions,
    remainingRepeats,
    displayId,
    dispensedAt,
    dispensedBy,
    patient,
    medicationPresetLabel,
    isDischargePrescription,
  } = item;

  // The dispense stores the label text in `instructions`; the clinical Instructions
  // shown here are derived from the details it was dispensed with.
  const derivedInstructions = buildInstructionText(prescription, getTranslation, getEnumTranslation);

  const patientIdDetail = {
    label: <TranslatedText stringId="medication.dispenseDetails.patientId" fallback="Patient ID" />,
    value: patient?.displayId || '-',
  };
  const medicationDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.medication" fallback="Medication" />
    ),
    value: (
      <TranslatedReferenceData
        fallback={prescription?.medication?.name}
        value={prescription?.medication?.id}
        category={prescription?.medication?.type}
      />
    ),
  };
  const prescriptionTypeDetail = {
    label: (
      <TranslatedText
        stringId="medication.dispenseDetails.prescriptionType"
        fallback="Prescription type"
      />
    ),
    value: <PharmacyPrescriptionTypeLabel isDischargePrescription={isDischargePrescription} />,
  };
  const dateDispensedDetail = {
    label: (
      <TranslatedText
        stringId="medication.dispenseDetails.dateDispensed"
        fallback="Date dispensed"
      />
    ),
    value: dispensedAt ? formatShortest(dispensedAt) : '-',
  };
  const qtyDispensedDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.qtyDispensed" fallback="Qty dispensed" />
    ),
    value: prescription?.dispensingUnit
      ? `${quantity} ${getDrugUnitLabel(prescription.dispensingUnit, quantity, getEnumTranslation)}`
      : (quantity ?? '-'),
  };
  const instructionsDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.instructions" fallback="Instructions" />
    ),
    value: derivedInstructions || '-',
  };
  const patientNameDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.patientName" fallback="Patient name" />
    ),
    value: patient ? <PatientNameDisplay patient={patient} /> : '-',
  };
  const prescriptionDateDetail = {
    label: (
      <TranslatedText
        stringId="medication.dispenseDetails.prescriptionDate"
        fallback="Prescription date"
      />
    ),
    value: prescription?.date ? formatShortest(trimToDate(prescription.date)) : '-',
  };
  const requestNoDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.requestNo" fallback="Request no." />
    ),
    value: displayId || '-',
  };
  const dispensedByDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.dispensedBy" fallback="Dispensed by" />
    ),
    value: dispensedBy?.displayName || '-',
  };
  const remainingRepeatsDetail = {
    label: (
      <TranslatedText
        stringId="medication.dispenseDetails.remainingRepeats"
        fallback="Remaining repeats"
      />
    ),
    value: remainingRepeats ?? 0,
  };
  const labelTextDetail = {
    label: <TranslatedText stringId="medication.dispenseDetails.labelText" fallback="Label text" />,
    value: instructions || '-',
  };
  const presetLabelDetail = {
    label: (
      <TranslatedText stringId="medication.dispenseDetails.presetLabels" fallback="Preset labels" />
    ),
    value: medicationPresetLabel?.code || '-',
  };

  // spec: DSPDET
  const leftDetails = [
    patientIdDetail,
    medicationDetail,
    prescriptionTypeDetail,
    dateDispensedDetail,
    qtyDispensedDetail,
    instructionsDetail,
  ];
  const rightDetails = [
    patientNameDetail,
    prescriptionDateDetail,
    requestNoDetail,
    dispensedByDetail,
    remainingRepeatsDetail,
    labelTextDetail,
    ...(hasPresetLabels ? [presetLabelDetail] : []),
  ];

  return (
    <StyledModal
      open={open}
      title={
        <TranslatedText
          stringId="medication.dispenseDetails.title"
          fallback="Dispensed medication"
        />
      }
      onClose={onClose}
    >
      <Container>
        <MedicationDetailsColumns leftDetails={leftDetails} rightDetails={rightDetails} />
      </Container>

      <ActionRow>
        <Button onClick={onClose}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      </ActionRow>
    </StyledModal>
  );
};
