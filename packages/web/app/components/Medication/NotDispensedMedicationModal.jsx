import React from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import * as yup from 'yup';

import {
  AutocompleteField,
  ConfirmCancelRow,
  Field,
  Form,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
  useSuggester,
} from '@tamanu/ui-components';
import { trimToDate } from '@tamanu/utils/dateTime';
import { useApi } from '../../api';
import { Colors } from '../../constants/styles';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { FormModal } from '../FormModal';

const StyledFormModal = styled(FormModal)`
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
  margin-bottom: 20px;
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

const StyledDivider = styled(Divider)`
  margin: 20px -32px;
`;

const getValidationSchema = () =>
  yup.object().shape({
    notDispensedReasonId: yup
      .string()
      .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  });

export const NotDispensedMedicationModal = ({ open, onClose, request, onSuccess }) => {
  const api = useApi();
  const { formatShortest } = useDateTime();
  const notDispensedReasonSuggester = useSuggester('medicationNotDispensedReason');

  if (!request || !open) return null;

  const { pharmacyOrder, prescription, displayId, repeats } = request;
  const patient = pharmacyOrder?.encounter?.patient;

  const details = [
    {
      label: <TranslatedText stringId="medication.notDispensed.modal.patientId" fallback="Patient ID" />,
      value: patient?.displayId || '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.notDispensed.modal.patientName" fallback="Patient name" />
      ),
      value: patient ? <PatientNameDisplay patient={patient} /> : '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.notDispensed.modal.medication" fallback="Medication" />
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
          stringId="medication.notDispensed.modal.prescriptionDate"
          fallback="Prescription date"
        />
      ),
      value: prescription?.date ? formatShortest(trimToDate(prescription.date)) : '-',
    },
    {
      label: (
        <TranslatedText stringId="medication.notDispensed.modal.requestNo" fallback="Request no." />
      ),
      value: displayId || '-',
    },
    {
      label: (
        <TranslatedText
          stringId="medication.notDispensed.modal.remainingRepeats"
          fallback="Remaining repeats"
        />
      ),
      value: repeats ?? 0,
    },
  ];

  const handleSubmit = async values => {
    await api.post(`medication/medication-requests/${request.id}/not-dispensed`, values);
    onSuccess?.();
    onClose();
  };

  return (
    <StyledFormModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.notDispensed.modal.title"
          fallback="Record medication as not dispensed"
        />
      }
    >
      <Text>
        <TranslatedText
          stringId="medication.notDispensed.modal.text"
          fallback="Would you like to record the below medication as not dispensed? The prescribing clinician will be notified and active request will be cancelled."
        />
        <br />
        <TranslatedText
          stringId="medication.notDispensed.modal.irreversible"
          fallback="This action is irreversible."
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
      <Form
        suppressErrorDialog
        onSubmit={handleSubmit}
        initialValues={{ notDispensedReasonId: '' }}
        validationSchema={getValidationSchema()}
        render={({ submitForm }) => (
          <>
            <Field
              name="notDispensedReasonId"
              component={AutocompleteField}
              label={
                <TranslatedText
                  stringId="medication.notDispensed.modal.reason.label"
                  fallback="Reason for not dispensing"
                />
              }
              suggester={notDispensedReasonSuggester}
              required
            />
            <StyledDivider />
            <ConfirmCancelRow
              onCancel={onClose}
              onConfirm={submitForm}
              cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
              confirmText={
                <TranslatedText
                  stringId="medication.notDispensed.modal.confirmButton"
                  fallback="Record as not dispensed"
                />
              }
            />
          </>
        )}
      />
    </StyledFormModal>
  );
};
