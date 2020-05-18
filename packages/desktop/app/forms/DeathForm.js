import React from 'react';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import { Form, Field, AutocompleteField, DateTimeField } from '../components/Field';

export const DeathForm = React.memo(
  ({ onCancel, onSubmit, practitionerSuggester, icd10Suggester }) => (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: new Date(),
      }}
      render={({ submitForm }) => (
        <FormGrid columns={1}>
          <Field
            name="primaryCause.id"
            label="Primary cause"
            component={AutocompleteField}
            suggester={icd10Suggester}
            required
          />
          <Field
            name="physician.id"
            label="Attending physician"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field name="date" label="Date" component={DateTimeField} required />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  ),
);
