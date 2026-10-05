import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import * as yup from 'yup';

import {
  AutocompleteField,
  ConfirmCancelRow,
  Field,
  Form,
  FormGrid,
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
  grid-column: span 2;

  > * {
    margin-top: 0;
  }
`;

const StyledFormGrid = styled(FormGrid)`
  margin-top: 0;
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

  const { pharmacyOrder, prescription, displayId, remainingRepeats } = request;
  const patient = pharmacyOrder?.encounter?.patient;

  const leftDetails = [
    {
      label: <TranslatedText stringId="medication.notDispensed.modal.patientId" fallback="Patient ID" />,
      value: patient?.displayId || '-',
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
        <TranslatedText stringId="medication.notDispensed.modal.requestNo" fallback="Request no." />
      ),
      value: displayId || '-',
    },
  ];

  const rightDetails = [
    {
      label: (
        <TranslatedText stringId="medication.notDispensed.modal.patientName" fallback="Patient name" />
      ),
      value: patient ? <PatientNameDisplay patient={patient} /> : '-',
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
        <TranslatedText
          stringId="medication.notDispensed.modal.remainingRepeats"
          fallback="Remaining repeats"
        />
      ),
      value: remainingRepeats ?? 0,
    },
  ];

  const handleSubmit = async values => {
    await api.post(`medication/medication-requests/${request.id}/not-dispensed`, values);
    onSuccess?.();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      width="sm"
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
        <br />
        <TranslatedText
          stringId="medication.notDispensed.modal.irreversible"
          fallback="This action is irreversible."
        />
      </Text>
      <Box mb={2.5}>
        <MedicationDetailsColumns leftDetails={leftDetails} rightDetails={rightDetails} />
      </Box>
      <Form
        suppressErrorDialog
        onSubmit={handleSubmit}
        initialValues={{ notDispensedReasonId: '' }}
        validationSchema={getValidationSchema()}
        render={({ submitForm }) => (
          <StyledFormGrid>
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
              data-testid="not-dispensed-reason"
            />
            <ActionRow>
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
            </ActionRow>
          </StyledFormGrid>
        )}
      />
    </FormModal>
  );
};
