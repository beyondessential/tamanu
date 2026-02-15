import React from 'react';
import * as yup from 'yup';
import {
  TranslatedSelectField,
  Form,
  FormGrid,
  FormSubmitCancelRow,
  useDateTime,
} from '@tamanu/ui-components';
import {
  DIAGNOSIS_CERTAINTY,
  DIAGNOSIS_CERTAINTY_VALUES,
  DIAGNOSIS_CERTAINTY_LABELS,
  FORM_TYPES,
} from '@tamanu/constants';
import { foreignKey } from '../utils/validation';

import { AutocompleteField, CheckField, DateField, Field } from '../components/Field';
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
    const { getCurrentDate } = useDateTime();

    const diagnosisSuggester = useSuggester('diagnosis', {
      filterer: icd => !excludeDiagnoses.some(d => d.diagnosisId === icd.id),
    });
    const practitionerSuggester = useSuggester('practitioner');

    return (
      <Form
        onSubmit={onSave}
        initialValues={{
          date: getCurrentDate(),
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
              data-testid="translatedtext-xf0m"
            />,
          ),
          certainty: yup
            .string()
            .oneOf(certaintyOptions)
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="diagnosis.certainty.label"
                fallback="Certainty"
                data-testid="translatedtext-unsr"
              />,
            ),
          date: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="general.date.label"
                fallback="Date"
                data-testid="translatedtext-r4iw"
              />,
            ),
        })}
        render={({ submitForm }) => (
          <FormGrid data-testid="formgrid-40h5">
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="diagnosisId"
                label={
                  <TranslatedText
                    stringId="general.localisedField.diagnosis.label"
                    fallback="Diagnosis"
                    data-testid="translatedtext-5vck"
                  />
                }
                component={AutocompleteField}
                suggester={diagnosisSuggester}
                required
                data-testid="field-f5vm"
              />
            </div>
            <Field
              style={{ gridColumn: '1 / -1' }}
              name="isPrimary"
              label={
                <TranslatedText
                  stringId="diagnosis.isPrimary.label"
                  fallback="Is primary"
                  data-testid="translatedtext-lctz"
                />
              }
              component={CheckField}
              data-testid="field-52wo"
            />
            <Field
              name="certainty"
              label={
                <TranslatedText
                  stringId="diagnosis.certainty.label"
                  fallback="Certainty"
                  data-testid="translatedtext-31jr"
                />
              }
              component={TranslatedSelectField}
              enumValues={DIAGNOSIS_CERTAINTY_LABELS}
              transformOptions={options =>
                options.filter(option => shouldIncludeCertaintyOption(option, isTriage, isEdit))
              }
              required
              data-testid="field-a9rl"
            />
            <Field
              name="date"
              label={
                <TranslatedText
                  stringId="general.date.label"
                  fallback="Date"
                  data-testid="translatedtext-r74v"
                />
              }
              component={DateField}
              required
              saveDateAsString
              data-testid="field-fszu"
            />
            <Field
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinician.label"
                  fallback="Clinician"
                  data-testid="translatedtext-lma3"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-af83"
            />
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onCancel}
              data-testid="formsubmitcancelrow-jfcw"
            />
          </FormGrid>
        )}
        data-testid="form-g4qp"
      />
    );
  },
);
