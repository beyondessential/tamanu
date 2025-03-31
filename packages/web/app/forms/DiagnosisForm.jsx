import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  DIAGNOSIS_CERTAINTY,
  DIAGNOSIS_CERTAINTY_VALUES,
  DIAGNOSIS_CERTAINTY_LABELS,
} from '@tamanu/constants';
import { foreignKey } from '../utils/validation';
import { FORM_TYPES } from '../constants';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  TranslatedSelectField,
} from '../components/Field';
import { useSuggester } from '../api';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

const TRIAGE_ONLY = [DIAGNOSIS_CERTAINTY.EMERGENCY];
const EDIT_ONLY = [DIAGNOSIS_CERTAINTY.DISPROVEN, DIAGNOSIS_CERTAINTY.ERROR];

const shouldIncludeCertaintyOption = (option, isTriage, isEdit) => {
  if (isTriage && TRIAGE_ONLY.includes(option.value)) return true;
  if (isEdit && EDIT_ONLY.includes(option.value)) return true;
  return !EDIT_ONLY.includes(option.value);
};

export const DiagnosisForm = React.memo(
  ({ isTriage = false, onCancel, onSave, diagnosis, excludeDiagnoses }) => {
    const isEdit = !!diagnosis?.id;
    // don't show the "ED Diagnosis" option if we're just on a regular encounter
    // (unless we're editing a diagnosis with ED certainty already set)
    const certaintyOptions = DIAGNOSIS_CERTAINTY_VALUES.filter(value =>
      shouldIncludeCertaintyOption({ value }, isTriage, isEdit),
    );
    const defaultCertainty = certaintyOptions[0].value;
    const hasDiagnosis = Boolean(diagnosis?.id);
    const { currentUser } = useAuth();

    const diagnosisSuggester = useSuggester('diagnosis', {
      filterer: icd => !excludeDiagnoses.some(d => d.diagnosisId === icd.id),
    });
    const practitionerSuggester = useSuggester('practitioner');

    return (
      <Form
        onSubmit={onSave}
        initialValues={{
          date: getCurrentDateTimeString(),
          isPrimary: true,
          certainty: defaultCertainty,
          ...diagnosis,
          clinicianId: hasDiagnosis ? diagnosis.clinicianId : currentUser.id,
        }}
        formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          diagnosisId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.diagnosis.label"
              fallback="Diagnosis"
              data-testid='translatedtext-0bmz' />,
          ),
          certainty: yup
            .string()
            .oneOf(certaintyOptions)
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="diagnosis.certainty.label"
                fallback="Certainty"
                data-testid='translatedtext-kiz0' />,
            ),
          date: yup
            .date()
            .required()
            .translatedLabel(<TranslatedText
            stringId="general.date.label"
            fallback="Date"
            data-testid='translatedtext-iaxv' />),
        })}
        render={({ submitForm }) => (
          <FormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="diagnosisId"
                label={
                  <TranslatedText
                    stringId="general.localisedField.diagnosis.label"
                    fallback="Diagnosis"
                    data-testid='translatedtext-p7l3' />
                }
                component={AutocompleteField}
                suggester={diagnosisSuggester}
                required
                data-testid='field-sohc' />
            </div>
            <Field
              style={{ gridColumn: '1 / -1' }}
              name="isPrimary"
              label={<TranslatedText
                stringId="diagnosis.isPrimary.label"
                fallback="Is primary"
                data-testid='translatedtext-0gkf' />}
              component={CheckField}
              data-testid='field-jehu' />
            <Field
              name="certainty"
              label={<TranslatedText
                stringId="diagnosis.certainty.label"
                fallback="Certainty"
                data-testid='translatedtext-0981' />}
              component={TranslatedSelectField}
              enumValues={DIAGNOSIS_CERTAINTY_LABELS}
              transformOptions={options =>
                options.filter(option => shouldIncludeCertaintyOption(option, isTriage, isEdit))
              }
              required
              data-testid='field-pleu' />
            <Field
              name="date"
              label={<TranslatedText
                stringId="general.date.label"
                fallback="Date"
                data-testid='translatedtext-3wbt' />}
              component={DateField}
              required
              saveDateAsString
              data-testid='field-wsdq' />
            <Field
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinician.label"
                  fallback="Clinician"
                  data-testid='translatedtext-ddjp' />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid='field-zo5s' />
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onCancel}
              data-testid='formsubmitcancelrow-388l' />
          </FormGrid>
        )}
      />
    );
  },
);
