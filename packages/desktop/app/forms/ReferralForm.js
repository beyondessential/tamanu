import React from 'react';

import { nonEmergencyDiagnosisCertaintyOptions } from '../constants';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { FormSectionSeparator } from '../components/FormSectionSeparator';
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
            name="referralNumber"
            label="Referral number"
            component={TextField}
            style={{ gridColumn: '1/-1' }}
            required
          />
          <Field
            name="referredById"
            label="Referring doctor"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field name="date" label="Date" component={DateField} required />
          <FormSectionSeparator heading={"Being referred to:"} />
          <Field name="urgent" label="Urgent priority" component={CheckField} required />
          <Field
            name="referredToDepartmentId"
            label="Department"
            component={AutocompleteField}
            suggester={departmentSuggester}
          />
          <Field
            name="referredToFacilityId"
            label="Facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <FormSeparatorLine />
          <Field
            name="diagnosisId"
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
