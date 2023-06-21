import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { foreignKey } from '../utils/validation';
import { diagnosisCertaintyOptions } from '../constants';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import {
  Form,
  Field,
  SelectField,
  CheckField,
  AutocompleteField,
  DateField,
} from '../components/Field';
import { useSuggester } from '../api';

export const DiagnosisForm = React.memo(
  ({ isTriage = false, onCancel, onSave, diagnosis, excludeDiagnoses }) => {
    // don't show the "ED Diagnosis" option if we're just on a regular encounter
    // (unless we're editing a diagnosis with ED certainty already set)
    const certaintyOptions = diagnosisCertaintyOptions.filter(x => {
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
        validationSchema={yup.object().shape({
          diagnosisId: foreignKey('Diagnosis must be selected'),
          certainty: yup
            .string()
            .oneOf(certaintyOptions.map(x => x.value))
            .required(),
          date: yup.date().required(),
        })}
        render={({ submitForm }) => (
          <FormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="diagnosisId"
                label="ICD10 code"
                component={AutocompleteField}
                suggester={icd10Suggester}
                required
              />
            </div>
            <Field
              style={{ gridColumn: '1 / -1' }}
              name="isPrimary"
              label="Is primary"
              component={CheckField}
            />
            <Field
              name="certainty"
              label="Certainty"
              component={SelectField}
              options={certaintyOptions}
              required
            />
            <Field name="date" label="Date" component={DateField} required saveDateAsString />
            <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
          </FormGrid>
        )}
      />
    );
  },
);
