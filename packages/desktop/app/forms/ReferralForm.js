import React from 'react';

import { nonEmergencyDiagnosisCertaintyOptions } from '../constants';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import {
  Form,
  Field,
  SelectField,
  CheckField,
  TextField,
  AutocompleteField,
  DateField,
} from '../components/Field';

export const ReferralForm = React.memo(
  ({
    onCancel,
    onSubmit,
    referral,
    icd10Suggester,
    practitionerSuggester,
    departmentSuggester,
    facilitySuggester,
  }) => (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: new Date(),
        certainty: 'confirmed',
        ...referral,
      }}
      render={({ submitForm }) => (
        <FormGrid>
          <Field
            name="id"
            label="Referral number"
            component={TextField}
            style={{ gridColumn: '1/-1' }}
            required
          />
          <Field
            name="referredBy.id"
            label="Referring doctor"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="facility.id"
            label="Referred facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <Field name="date" label="Date" component={DateField} required />
          <Field
            name="department.id"
            label="Department"
            component={AutocompleteField}
            suggester={departmentSuggester}
          />
          <Field name="urgent" label="Urgent priority" component={CheckField} required />
          <FormSeparatorLine />
          <Field
            name="diagnosis.id"
            label="Diagnosis"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
          <Field
            name="certainty"
            label="Certainty"
            component={SelectField}
            options={nonEmergencyDiagnosisCertaintyOptions}
            required
          />
          <Field
            name="notes"
            label="Notes"
            component={TextField}
            multiline
            style={{ gridColumn: '1 / -1' }}
            rows={4}
          />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  ),
);
