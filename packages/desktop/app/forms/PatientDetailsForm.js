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
  educationalAttainmentOptions,
} from '../constants';

export const PrimaryDetailsGroup = ({ villageSuggester }) => (
  <React.Fragment>
    <Field name="firstName" label="First name" component={TextField} required />
    <Field name="middleName" label="Middle name" component={TextField} />
    <Field name="lastName" label="Last name" component={TextField} required />
    <Field name="culturalName" label="Cultural/Traditional name" component={TextField} />
    <Field name="dateOfBirth" label="Date of birth" component={DateField} required />
    <Field
      name="villageId"
      label="Village"
      component={AutocompleteField}
      suggester={villageSuggester}
    />
    <Field name="sex" label="Sex" component={RadioField} options={sexOptions} inline required />
  </React.Fragment>
);

export const SecondaryDetailsGroup = ({
  medicalAreaSuggester,
  nursingZoneSuggester,
  settlementSuggester,
  occupationSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  countrySuggester,
  divisionSuggester,
  subdivisionSuggester,
}) => (
  <React.Fragment>
    <Field name="bloodType" label="Blood type" component={SelectField} options={bloodOptions} />
    <Field name="title" label="Title" component={SelectField} options={titleOptions} />
    <Field name="placeOfBirth" label="Place of birth" component={TextField} />
    <Field
      name="maritalStatus"
      label="Marital Status"
      component={SelectField}
      options={maritalStatusOptions}
    />
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
      name="socialMedia"
      label="Social media platform"
      component={SelectField}
      options={socialMediaOptions}
    />
    <Field
      name="settlementId"
      label="Settlement"
      component={AutocompleteField}
      suggester={settlementSuggester}
    />
    <Field name="streetVillage" label="Residential Landmark" component={TextField} />
    <Field name="cityTown" label="City/Town" component={TextField} />
    <Field
      name="subdivisionId"
      label="Sub Division"
      component={AutocompleteField}
      suggester={subdivisionSuggester}
    />
    <Field
      name="divisionId"
      label="Division"
      component={AutocompleteField}
      suggester={divisionSuggester}
    />
    <Field
      name="countryId"
      label="Country"
      component={AutocompleteField}
      suggester={countrySuggester}
    />
    <Field
      name="medicalAreaId"
      label="Medical Area"
      component={AutocompleteField}
      suggester={medicalAreaSuggester}
    />
    <Field
      name="nursingZoneId"
      label="Nursing Zone"
      component={AutocompleteField}
      suggester={nursingZoneSuggester}
    />
    <Field
      name="nationalityId"
      label="Nationality"
      component={AutocompleteField}
      suggester={nationalitySuggester}
    />
    <Field
      name="ethnicityId"
      label="Ethnicity"
      component={AutocompleteField}
      suggester={ethnicitySuggester}
    />
    <Field
      name="occupationId"
      label="Occupation"
      component={AutocompleteField}
      suggester={occupationSuggester}
    />
    <Field
      name="educationalLevel"
      label="Educational Attainment"
      component={SelectField}
      options={educationalAttainmentOptions}
    />
  </React.Fragment>
);

export const PatientDetailsForm = ({
  patientSuggester,
  facilitySuggester,
  villageSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  countrySuggester,
  divisionSuggester,
  subdivisionSuggester,
  medicalAreaSuggester,
  nursingZoneSuggester,
  settlementSuggester,
  occupationSuggester,
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
          divisionSuggester={divisionSuggester}
          subdivisionSuggester={subdivisionSuggester}
        />
        <SecondaryDetailsGroup
          patientSuggester={patientSuggester}
          facilitySuggester={facilitySuggester}
          medicalAreaSuggester={medicalAreaSuggester}
          nursingZoneSuggester={nursingZoneSuggester}
          settlementSuggester={settlementSuggester}
          occupationSuggester={occupationSuggester}
          countrySuggester={countrySuggester}
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
      divisionSuggester,
      subdivisionSuggester,
      medicalAreaSuggester,
      nursingZoneSuggester,
      settlementSuggester,
      occupationSuggester,
    ],
  );

  return (
    <Form
      render={render}
      initialValues={{ ...patient, ...patient.additionalData }}
      onSubmit={onSubmit}
    />
  );
};
