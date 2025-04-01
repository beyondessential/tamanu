import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Box } from '@mui/material';

import {
  BaseModal,
  Field,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  NumberField,
  SelectField,
  TextField,
  TranslatedText,
} from '..';
import { Colors, FORM_TYPES } from '../../constants';
import { useApi } from '../../api';
import { foreignKey } from '../../utils/validation';
import { MedicationSummary } from './MedicationSummary';
import { preventInvalidNumber } from '../../utils';
import { MEDICATION_PAUSE_DURATION_UNITS_LABELS } from '@tamanu/constants';
import { add, isBefore } from 'date-fns';
import { useEncounter } from '../../contexts/Encounter';

const StyledBaseModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

const DarkText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const StyledFormActions = styled(Box)`
  margin: 0 -32px -12px;
  padding: 20px 40px 0;
  border-top: 1px solid ${Colors.outline};
  display: flex;
  justify-content: flex-end;
  gap: 16px;
`;

const validationSchema = yup.object().shape({
  pauseDuration: yup
    .number()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
    .positive(<TranslatedText stringId="validation.positive" fallback="*Must be positive" />)
    .test(
      'pauseDurationValidation',
      <TranslatedText
        stringId="medication.pauseModal.pauseDurationValidation"
        fallback="Cannot extend beyond medication end date"
      />,
      (value, context) => {
        const medication = context.parent.medication;
        const endDate = medication.endDate;

        if (!value || !endDate || !context.parent.pauseTimeUnit) return true;

        return isBefore(
          add(new Date(), { [context.parent.pauseTimeUnit]: value }),
          new Date(endDate),
        );
      },
    ),
  pauseTimeUnit: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
});

export const MedicationPauseModal = ({ medication, onPause, onClose }) => {
  const { encounter } = useEncounter();
  const api = useApi();

  const onSubmit = async data => {
    await api.post(`medication/${medication.id}/pause`, data);
    onPause();
    onClose();
  };

  return (
    <StyledBaseModal
      open
      onClose={onClose}
      title={<TranslatedText stringId="medication.pauseModal.title" fallback="Pause medication" />}
    >
      <Form
        suppressErrorDialog
        onSubmit={onSubmit}
        onSuccess={onClose}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{
          medication,
          encounterId: encounter.id,
        }}
        validationSchema={validationSchema}
        render={({ submitForm }) => (
          <>
            <Box px={1} pt={2.75} pb={5}>
              <DarkText>
                <TranslatedText
                  stringId="medication.pauseModal.description"
                  fallback="Please confirm the duration that you would like to pause the medication below."
                />
              </DarkText>
              <MedicationSummary medication={medication} />
              <FormGrid>
                <FormGrid nested>
                  <Field
                    name="pauseDuration"
                    label={
                      <TranslatedText
                        stringId="medication.pauseModal.duration.label"
                        fallback="Duration"
                      />
                    }
                    component={NumberField}
                    min={0}
                    onInput={preventInvalidNumber}
                    required
                  />
                  <Field
                    name="pauseTimeUnit"
                    label={<Box sx={{ opacity: 0 }}>.</Box>}
                    component={SelectField}
                    options={Object.entries(MEDICATION_PAUSE_DURATION_UNITS_LABELS).map(
                      ([value, label]) => ({
                        value,
                        label,
                      }),
                    )}
                  />
                </FormGrid>
                <Field
                  name="notes"
                  label={
                    <TranslatedText stringId="medication.pauseModal.notes.label" fallback="Notes" />
                  }
                  component={TextField}
                />
              </FormGrid>
            </Box>
            <StyledFormActions>
              <FormCancelButton onClick={onClose}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </FormCancelButton>
              <FormSubmitButton
                color="primary"
                onClick={data => {
                  submitForm(data);
                }}
              >
                <TranslatedText stringId="medication.details.pause" fallback="Pause" />
              </FormSubmitButton>
            </StyledFormActions>
          </>
        )}
      />
    </StyledBaseModal>
  );
};
