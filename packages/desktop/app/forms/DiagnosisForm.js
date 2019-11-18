import React from 'react';

import { diagnosisCertainty } from '../constants';

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

export const DiagnosisForm = React.memo(
  ({ isTriage = false, onCancel, onSave, diagnosis, icd10Suggester }) => {
    // don't show the "ED Diagnosis" option if we're just on a regular visit
    // (unless we're editing a diagnosis with ED certainty already set)
    const certaintyOptions =
      isTriage || (diagnosis && diagnosis.certainty === 'emergency')
        ? diagnosisCertainty
        : diagnosisCertainty.filter(x => x.value !== 'emergency');
    const defaultCertainty = isTriage ? 'emergency' : 'suspected';

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
