import React from 'react';

import { FormGrid } from '../components/FormGrid';
import { ButtonRow } from '../components/ButtonRow';
import { Button } from '../components/Button';

import {
  Form,
  Field,
  DateField,
  AutocompleteField,
  TextField,
  RadioField,
} from '../components/Field';

import { sexOptions } from '../constants';

export const PrimaryDetailsGroup = () => (
  <React.Fragment>
    <Field name="firstName" label="First name" component={TextField} required />
    <Field name="middleName" label="Middle name" component={TextField} />
    <Field name="lastName" label="Last name" component={TextField} required />
    <Field name="culturalName" label="Cultural/Traditional name" component={TextField} />
    <Field name="dateOfBirth" label="Date of birth" component={DateField} required />
    <Field name="sex" label="Sex" component={RadioField} options={sexOptions} inline required />
  </React.Fragment>
);

export const SecondaryDetailsGroup = ({ patientSuggester, facilitySuggester }) => (
  <React.Fragment>
    <Field name="religion" label="Religion" component={TextField} />
    <Field name="occupation" label="Occupation" component={TextField} />
    <Field
      name="mother"
      label="Mother"
      component={AutocompleteField}
      suggester={patientSuggester}
    />
    <Field
      name="father"
      label="Father"
      component={AutocompleteField}
      suggester={patientSuggester}
    />
    <Field name="externalId" label="External patient ID" component={TextField} />
    <Field
      component={RadioField}
      name="patientType"
      label="Patient Type"
      options={[{ value: 'charity', label: 'Charity' }, { value: 'private', label: 'Private' }]}
      inline
    />
    <Field name="bloodType" label="Blood type" component={TextField} />
    <Field name="placeOfBirth" label="Place of birth" component={TextField} />
    <Field name="referredBy" label="Referred by" component={TextField} />
    <Field name="referredDate" label="Referred date" component={DateField} />
    <Field
      name="homeClinic"
      label="Home clinic"
      component={AutocompleteField}
      suggester={facilitySuggester}
    />
  </React.Fragment>
);

export const PatientDetailsForm = ({ patientSuggester, facilitySuggester, patient, onSubmit }) => {
  const render = React.useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <PrimaryDetailsGroup />
        <SecondaryDetailsGroup
          patientSuggester={patientSuggester}
          facilitySuggester={facilitySuggester}
        />
        <ButtonRow>
          <Button variant="contained" color="primary" onClick={submitForm}>
            Save
          </Button>
        </ButtonRow>
      </FormGrid>
    ),
    [patientSuggester, facilitySuggester],
  );

  return <Form render={render} initialValues={patient} onSubmit={onSubmit} />;
};
