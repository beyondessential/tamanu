import React from 'react';

import { diagnosisCertainty } from '../constants';

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
    locationSuggester,
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
            name="_id"
            label="Referral number"
            component={TextField}
            style={{ gridColumn: '1/-1' }}
            required
          />
          <Field
            name="referringDoctor._id"
            label="Referring doctor"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="facility._id"
            label="Referred facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <Field name="date" label="Date" component={DateField} required />
          <Field
            name="location._id"
            label="Department"
            component={AutocompleteField}
            suggester={locationSuggester}
          />
          <Field name="urgent" label="Urgent priority" component={CheckField} required />
          <FormSeparatorLine />
          <Field
            name="diagnosis._id"
            label="Diagnosis"
            component={AutocompleteField}
            suggester={icd10Suggester}
          />
          <Field
            name="certainty"
            label="Certainty"
            component={SelectField}
            options={diagnosisCertainty}
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
