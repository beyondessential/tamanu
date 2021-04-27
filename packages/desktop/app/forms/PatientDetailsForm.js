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

export const PrimaryDetailsGroup = ({
  villageSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  divisionSuggester,
  subdivisionSuggester,
}) => (
  <React.Fragment>
    <Field name="birthCertificateNumber" label="Birth Certificate Number" component={TextField} />
    <Field name="drivingLicenseNumber" label="Driving License Number" component={TextField} />
    <Field name="passportNumber" label="Passport Number" component={TextField} />
    <Field name="title" label="Title" component={SelectField} options={titleOptions} />
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
    <Field name="placeOfBirth" label="Place of birth" component={TextField} />
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
    <Field
      name="divisionId"
      label="Division"
      component={AutocompleteField}
      suggester={divisionSuggester}
    />
    <Field
      name="subdivisionId"
      label="Sub Division"
      component={AutocompleteField}
      suggester={subdivisionSuggester}
    />
    <Field
      name="maritalStatus"
      label="Marital Status"
      component={SelectField}
      options={maritalStatusOptions}
    />
    <Field
      name="ethnicityId"
      label="Tribe"
      component={AutocompleteField}
      suggester={ethnicitySuggester}
    />
  </React.Fragment>
);

export const SecondaryDetailsGroup = ({
  isBirth,
  patientSuggester,
  facilitySuggester,
  medicalAreaSuggester,
  nursingZoneSuggester,
  settlementSuggester,
  occupationSuggester,
}) => (
  <React.Fragment>
    <Field name="religion" label="Religion" component={TextField} />
    <Field
      name="occupationId"
      label="Occupation"
      component={AutocompleteField}
      suggester={occupationSuggester}
    />
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
        { value: 'local', label: 'Local' },
        { value: 'visitor', label: 'Visitor' },
      ]}
      inline
    />
    <Field name="bloodType" label="Blood type" component={SelectField} options={bloodOptions} />
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
      name="settlementId"
      label="Settlement"
      component={AutocompleteField}
      suggester={settlementSuggester}
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
    <Field name="email" label="Email" component={TextField} />
    <Field
      name="educationalAttainment"
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

  return <Form render={render} initialValues={patient} onSubmit={onSubmit} />;
};
