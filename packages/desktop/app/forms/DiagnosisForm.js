import React from 'react';

import {
  diagnosisCertaintyOptions,
  nonEmergencyDiagnosisCertaintyOptions,
  CERTAINTY_OPTIONS_BY_VALUE,
} from '../constants';

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

const CERTAINTY_EMERGENCY = CERTAINTY_OPTIONS_BY_VALUE.emergency.value;
const CERTAINTY_SUSPECTED = CERTAINTY_OPTIONS_BY_VALUE.suspected.value;

export const DiagnosisForm = React.memo(
  ({ isTriage = false, onCancel, onSave, diagnosis, icd10Suggester }) => {
    // don't show the "ED Diagnosis" option if we're just on a regular visit
    // (unless we're editing a diagnosis with ED certainty already set)
    const certaintyOptions =
      isTriage || (diagnosis && diagnosis.certainty === CERTAINTY_EMERGENCY)
        ? diagnosisCertaintyOptions
        : nonEmergencyDiagnosisCertaintyOptions;
    const defaultCertainty = isTriage ? CERTAINTY_EMERGENCY : CERTAINTY_SUSPECTED;

    return (
      <Form
        onSubmit={onSave}
        initialValues={{
          date: new Date(),
          isPrimary: true,
          certainty: defaultCertainty,
          ...diagnosis,
        }}
        render={({ submitForm }) => (
          <FormGrid>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field
                name="diagnosis._id"
                label="ICD10 Code"
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
            <Field name="date" label="Date" component={DateField} required />
            <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
          </FormGrid>
        )}
      />
    );
  },
);
