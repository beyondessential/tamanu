import React from 'react';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import { Form, Field, AutocompleteField, DateTimeField } from '../components/Field';

export const AppointmentForm = React.memo(
  ({
    onCancel,
    onSubmit,
    appointment,
    locationSuggester,
    facilitySuggester,
    practitionerSuggester,
  }) => (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        ...appointment,
      }}
      render={({ submitForm }) => (
        <FormGrid columns={1}>
          <Field name="date" label="Date" component={DateTimeField} required />
          <Field
            name="facility.id"
            label="Facility"
            component={AutocompleteField}
            required
            suggester={facilitySuggester}
          />
          <Field
            name="practitioner.id"
            label="Practitioner"
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
          <Field
            name="location.id"
            label="Location"
            component={AutocompleteField}
            suggester={locationSuggester}
          />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  ),
);
