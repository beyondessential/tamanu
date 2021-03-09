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
  SelectField,
} from '../components/Field';

import {
  sexOptions,
  bloodOptions,
  titleOptions,
  socialMediaOptions,
  maritalStatusOptions,
} from '../constants';

export const PrimaryDetailsGroup = ({
  villageSuggester,
  ethnicitySuggester,
  nationalitySuggester,
}) => (
  <React.Fragment>
    <Field name="firstName" label="First name" component={TextField} required />
    <Field name="middleName" label="Middle name" component={TextField} />
    <Field name="title" label="Title" component={SelectField} options={titleOptions} />
    <Field name="lastName" label="Last name" component={TextField} required />
    <Field name="culturalName" label="Cultural/Traditional name" component={TextField} />
    <Field
      name="villageId"
      label="Village"
      component={AutocompleteField}
      suggester={villageSuggester}
    />
    <Field name="dateOfBirth" label="Date of birth" component={DateField} required />
    <Field name="placeOfBirth" label="Plate of birth" component={TextField} />
    <Field name="sex" label="Sex" component={RadioField} options={sexOptions} inline required />
    <Field
      name="nationalityId"
      label="Nationality"
      component={AutocompleteField}
      suggester={nationalitySuggester}
    />
    <Field
      name="countryId"
      label="Country"
      component={AutocompleteField}
      suggester={nationalitySuggester}
    />
    <Field name="cityTown" label="City/Town" component={TextField} />
    <Field name="streetVillage" label="Street/Village" component={TextField} />
    <Field
      name="maritalStatus"
      label="MaritalStatus"
      component={SelectField}
      options={maritalStatusOptions}
    />
    <Field
      name="ethnicityId"
      label="Ethnicity"
      component={AutocompleteField}
      suggester={ethnicitySuggester}
    />
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
      options={[
        { value: 'charity', label: 'Charity' },
        { value: 'private', label: 'Private' },
      ]}
      inline
    />
    <Field name="bloodType" label="Blood type" component={SelectField} options={bloodOptions} />
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
    <Field
      name="primaryContactNumber"
      label="Primary Contact Number"
      component={TextField}
      type="tel"
    />
    <Field
      name="secondaryContactNumber"
      label="Secondary Contact Number"
      component={TextField}
      type="tel"
    />
    <Field
      name="socialMediaPlatform"
      label="Social media platform"
      component={SelectField}
      options={socialMediaOptions}
    />
    <Field name="socialMediaName" label="Social media name" component={TextField} />
    <Field name="email" label="Email" component={TextField} />
  </React.Fragment>
);

export const PatientDetailsForm = ({
  patientSuggester,
  facilitySuggester,
  villageSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  patient,
  onSubmit,
}) => {
  const render = React.useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <PrimaryDetailsGroup
          villageSuggester={villageSuggester}
          ethnicitySuggester={ethnicitySuggester}
          nationalitySuggester={nationalitySuggester}
        />
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
    [
      villageSuggester,
      ethnicitySuggester,
      nationalitySuggester,
      patientSuggester,
      facilitySuggester,
    ],
  );

  return <Form render={render} initialValues={patient} onSubmit={onSubmit} />;
};
