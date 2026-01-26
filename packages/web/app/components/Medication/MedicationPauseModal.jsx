import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Box } from '@mui/material';
import { MEDICATION_PAUSE_DURATION_UNITS_LABELS, FORM_TYPES } from '@tamanu/constants';
import {
  SelectField,
  TextField,
  Form,
  FormCancelButton,
  FormGrid,
  FormSubmitButton,
  BaseModal,
  TranslatedText,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { Field, NumberField } from '..';
import { useApi } from '../../api';
import { foreignKey } from '../../utils/validation';
import { MedicationSummary } from './MedicationSummary';
import { preventInvalidNumber } from '../../utils';
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

const ExtendBeyondEndDateError = styled(Box)`
  color: ${Colors.alert};
  font-size: 11px;
  line-height: 15px;
  font-weight: 500;
  grid-column: 1 / -1;
  margin: -12px 2px 0;
`;

const validationSchema = yup.object().shape({
  pauseDuration: yup
    .number()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
    .positive(<TranslatedText stringId="validation.positive" fallback="*Must be positive" />),
  pauseTimeUnit: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  extendBeyondEndDate: yup.mixed().test('extendBeyondEndDate', (_, context) => {
    const { medication, pauseDuration, pauseTimeUnit } = context.parent;
    const endDate = medication.endDate;

    if (!pauseDuration || !pauseTimeUnit || !endDate) return true;
    return isBefore(add(new Date(), { [pauseTimeUnit]: pauseDuration }), new Date(endDate));
  }),
});

export const MedicationPauseModal = ({ medication, onPause, onClose }) => {
  const { getCurrentDateTimeString } = useDateTimeFormat();
  const { encounter } = useEncounter();
  const api = useApi();

  const onSubmit = async data => {
    await api.post(`medication/${medication.id}/pause`, {
      ...data,
      pauseStartDate: getCurrentDateTimeString(),
    });
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
        render={({ submitForm, errors }) => (
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
                  {errors.extendBeyondEndDate && (
                    <ExtendBeyondEndDateError>
                      <TranslatedText
                        stringId="medication.pauseModal.pauseValidation"
                        fallback="Cannot extend beyond medication end date"
                      />
                    </ExtendBeyondEndDateError>
                  )}
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
