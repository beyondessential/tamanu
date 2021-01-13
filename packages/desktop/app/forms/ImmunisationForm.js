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
  SelectField,
} from '../components/Field';
import { immunisationStatusList } from '../constants';

const VaccineScheduleOptions = [
  { value: 'Routine', label: 'Routine' },
  { value: 'Catch-Up', label: 'Catch-Up' },
  { value: 'Campaign', label: 'Campaign' },
];

const vaccineOptions = [
  { label: 'BCG Vaccine', value: 'BCG Vaccine' },
  { label: 'Hepatitis B', value: 'Hepatitis B' },
  { label: 'Rotarix', value: 'Rotarix' },
  { label: 'Pneumococcal Vaccine', value: 'Pneumococcal Vaccine' },
  { label: 'Pentavalent', value: 'Pentavalent' },
  { label: 'Bivalent Oral Polio Vaccine', value: 'Bivalent Oral Polio Vaccine' },
  { label: 'Inactivated Polio Vaccine', value: 'Inactivated Polio Vaccine' },
  { label: 'Measles Mumps Rubella', value: 'Measles Mumps Rubella' },
  { label: 'Typhoid	Typhoid Conjugate Vaccine', value: 'Typhoid	Typhoid Conjugate Vaccine' },
  { label: 'Diptheria Tetanus Pertussis', value: 'Diptheria Tetanus Pertussis' },
  { label: 'Oral Polio Vaccine', value: 'Oral Polio Vaccine' },
  { label: 'Tetanus Booster', value: 'Tetanus Booster' },
  { label: 'Measles & Rubella', value: 'Measles & Rubella' },
  { label: 'Human Papillomavirus Vaccine', value: 'Human Papillomavirus Vaccine' },
  { label: 'COVID-19 Vaccine', value: 'COVID-19 Vaccine' },
  { label: 'Inactivated Polio Vaccine', value: 'Inactivated Polio Vaccine' },
];

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
            component={SelectField}
            style={{ gridColumn: '1/-1' }}
            options={VaccineScheduleOptions}
            required
          />
          <div style={{ gridColumn: '1/-1' }}>
            <Field
              name="vaccine"
              label="Vaccine"
              component={AutocompleteField}
              options={vaccineOptions}
              required
            />
          </div>
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
            label="Health Facility"
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
