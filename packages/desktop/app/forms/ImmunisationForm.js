import React from 'react';

import { ConfirmCancelRow } from '../components/ButtonRow';
import { FormGrid } from '../components/FormGrid';
import {
  Form,
  Field,
  TextField,
  AutocompleteField,
  DateField,
  RadioField,
} from '../components/Field';
import { immunisationStatusList } from '../constants';

export const ImmunisationForm = React.memo(
  ({ onCancel, onSubmit, practitionerSuggester, facilitySuggester }) => (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: new Date(),
      }}
      render={({ submitForm }) => (
        <FormGrid>
          <Field
            name="schedule"
            label="Schedule"
            component={TextField}
            style={{ gridColumn: '1/-1' }}
            required
          />
          <Field
            name="vaccine"
            label="Vaccine"
            component={TextField}
            style={{ gridColumn: '1/-1' }}
            required
          />
          <Field name="date" label="Date" component={DateField} required />
          <Field
            name="givenById"
            label="Given by"
            component={AutocompleteField}
            suggester={practitionerSuggester}
            required
          />
          <Field
            name="facilityId"
            label="Facility"
            component={AutocompleteField}
            suggester={facilitySuggester}
          />
          <Field name="batch" label="Batch" component={TextField} required />
          <Field
            name="timeliness"
            label="Timeliness"
            inline
            component={RadioField}
            options={immunisationStatusList}
          />
          <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      )}
    />
  ),
);
