import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { DIAGNOSIS_CERTAINTY, DIAGNOSIS_CERTAINTY_LABELS } from '@tamanu/constants';
import { foreignKey } from '../utils/validation';
import { DIAGNOSIS_CERTAINTY_OPTIONS, FORM_TYPES } from '../constants';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  SelectField,
} from '../components/Field';
import { useSuggester } from '../api';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { TranslatedSelectField } from '../components/Translation/TranslatedSelect';

/**
 * export const DIAGNOSIS_CERTAINTY_OPTIONS = [
  {
    value: DIAGNOSIS_CERTAINTY.EMERGENCY,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.EMERGENCY],
    triageOnly: true,
  },
  {
    value: DIAGNOSIS_CERTAINTY.SUSPECTED,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.SUSPECTED],
  },
  {
    value: DIAGNOSIS_CERTAINTY.CONFIRMED,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.CONFIRMED],
  },
  {
    value: DIAGNOSIS_CERTAINTY.DISPROVEN,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.DISPROVEN],
    editOnly: true,
  },
  {
    value: DIAGNOSIS_CERTAINTY.ERROR,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.ERROR],
    editOnly: true,
  },
];
 */

const TRIAGE_ONLY = [DIAGNOSIS_CERTAINTY.EMERGENCY];
const EDIT_ONLY = [DIAGNOSIS_CERTAINTY.DISPROVEN, DIAGNOSIS_CERTAINTY.ERROR];

export const DiagnosisForm = React.memo(
  ({ isTriage = false, onCancel, onSave, diagnosis, excludeDiagnoses }) => {
    const isEdit = !!diagnosis?.id;
    // don't show the "ED Diagnosis" option if we're just on a regular encounter
    // (unless we're editing a diagnosis with ED certainty already set)
    const certaintyOptions = DIAGNOSIS_CERTAINTY_OPTIONS.filter(x => {
      if (x.editOnly && !(diagnosis && diagnosis.id)) return false;
      if (x.triageOnly && !isTriage) return false;
      return true;
    });
    const defaultCertainty = certaintyOptions[0].value;

    const icd10Suggester = useSuggester('icd10', {
      filterer: icd => !excludeDiagnoses.some(d => d.diagnosisId === icd.id),
    });

    return (
      <Form
        onSubmit={onSave}
        initialValues={{
          date: getCurrentDateTimeString(),
          isPrimary: true,
          certainty: defaultCertainty,
          ...diagnosis,
        }}
        formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          diagnosisId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.diagnosis.label"
              fallback="Diagnosis"
            />,
          ),
          certainty: yup
            .string()
            .oneOf(certaintyOptions.map(x => x.value))
            .required()
            .translatedLabel(
              <TranslatedText stringId="diagnosis.certainty.label" fallback="Certainty" />,
            ),
          date: yup
            .date()
            .required()
            .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
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
                  />
                }
                component={AutocompleteField}
                suggester={icd10Suggester}
                required
              />
            </div>
            <Field
              style={{ gridColumn: '1 / -1' }}
              name="isPrimary"
              label={<TranslatedText stringId="diagnosis.isPrimary.label" fallback="Is primary" />}
              component={CheckField}
            />
            <Field
              name="certainty"
              label={<TranslatedText stringId="diagnosis.certainty.label" fallback="Certainty" />}
              component={TranslatedSelectField}
              enumValues={DIAGNOSIS_CERTAINTY_LABELS}
              transformOptions={options => {
                return options.filter(option => {
                  if (isTriage && TRIAGE_ONLY.includes(option.value)) return true;
                  if (isEdit && EDIT_ONLY.includes(option.value)) return true;
                  return !EDIT_ONLY.includes(option.value);
                });
              }}
              required
              prefix="diagnosis.property.certainty"
            />
            <Field
              name="date"
              label={<TranslatedText stringId="general.date.label" fallback="Date" />}
              component={DateField}
              required
              saveDateAsString
            />
            <FormSubmitCancelRow onConfirm={submitForm} onCancel={onCancel} />
          </FormGrid>
        )}
      />
    );
  },
);
