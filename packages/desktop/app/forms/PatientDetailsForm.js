import React from 'react';
import { Chance } from 'chance';

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

export const PrimaryDetailsGroup = ({ villageSuggester }) => (
  <React.Fragment>
    <Field name="firstName" label="First name" component={TextField} required />
    <Field name="middleName" label="Middle name" component={TextField} />
    <Field name="lastName" label="Last name" component={TextField} required />
    <Field name="culturalName" label="Cultural/Traditional name" component={TextField} />
    <Field
      name="villageId"
      label="Village"
      component={AutocompleteField}
      suggester={villageSuggester}
    />
    <Field name="dateOfBirth" label="Date of birth" component={DateField} required />
    <Field name="sex" label="Sex" component={RadioField} options={sexOptions} inline required />
  </React.Fragment>
);

export const SecondaryDetailsGroup = ({ isBirth, patientSuggester, facilitySuggester }) => (
  <React.Fragment>
    <Field name="religion" label="Religion" component={TextField} />
    <Field name="occupation" label="Occupation" component={TextField} />
    <Field
      name="mother.id"
      label="Mother"
      component={AutocompleteField}
      suggester={patientSuggester}
      required={isBirth}
    />
    <Field
      name="father.id"
      label="Father"
      component={AutocompleteField}
      suggester={patientSuggester}
    />
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
      required={isBirth}
    />
    <Field name="residentialAddress" label="Residential address" component={TextField} />
    <Field name="contactNumber" label="Contact number" component={TextField} />
    <Field name="socialMediaPlatform" label="Social media platform" component={TextField} />
    <Field name="socialMediaName" label="Social media name" component={TextField} />
    <Field name="email" label="Email" component={TextField} />
  </React.Fragment>
);

export const PatientDetailsForm = ({
  patientSuggester,
  facilitySuggester,
  villageSuggester,
  patient,
  onSubmit,
}) => {
  const chance = new Chance(patient.id); // seed random with user id for reproducible values
  const dummyData = {
    residentialAddress: `${chance.address()}, ${chance.city()}, Fiji`,
    contactNumber: `${chance.phone({ formatted: false }).slice(0, 3)} ${chance.phone({ formatted: false }).slice(0, 4)}`,
    socialMediaPlatform: chance.pickone(['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'Viber', 'Whatsapp']),
    socialMediaName: `@${chance.animal().replace(/[^a-zA-Z]/g, '')}${chance.natural({ min: 0, max: 99, exclude: [69] })}`,
    email: chance.email(),
  };

  const render = React.useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <PrimaryDetailsGroup villageSuggester={villageSuggester} />
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

  return <Form render={render} initialValues={{ ...patient, ...dummyData }} onSubmit={onSubmit} />;
};
