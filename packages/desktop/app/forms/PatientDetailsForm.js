import React from 'react';

import { FormGrid } from '../components/FormGrid';
import { ButtonRow } from '../components/ButtonRow';
import { Button } from '../components/Button';

import {
  Form,
  LocalisedField,
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
    <LocalisedField name="firstName" component={TextField} required />
    <LocalisedField name="middleName" component={TextField} />
    <LocalisedField name="lastName" component={TextField} required />
    <LocalisedField name="culturalName" component={TextField} />
    <LocalisedField name="dateOfBirth" component={DateField} required />
    <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
    <LocalisedField name="sex" component={RadioField} options={sexOptions} inline required />
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
    <LocalisedField name="bloodType" component={SelectField} options={bloodOptions} />
    <LocalisedField name="title" component={SelectField} options={titleOptions} />
    <LocalisedField name="placeOfBirth" component={TextField} />
    <LocalisedField name="maritalStatus" component={SelectField} options={maritalStatusOptions} />
    <LocalisedField name="primaryContactNumber" component={TextField} type="tel" />
    <LocalisedField name="secondaryContactNumber" component={TextField} type="tel" />
    <LocalisedField name="socialMedia" component={SelectField} options={socialMediaOptions} />
    <LocalisedField name="settlementId" component={AutocompleteField} suggester={settlementSuggester} />
    <LocalisedField name="streetVillage" component={TextField} />
    <LocalisedField name="cityTown" component={TextField} />
    <LocalisedField name="subdivisionId" component={AutocompleteField} suggester={subdivisionSuggester} />
    <LocalisedField name="divisionId" component={AutocompleteField} suggester={divisionSuggester} />
    <LocalisedField name="countryId" component={AutocompleteField} suggester={countrySuggester} />
    <LocalisedField name="medicalAreaId" component={AutocompleteField} suggester={medicalAreaSuggester} />
    <LocalisedField name="nursingZoneId" component={AutocompleteField} suggester={nursingZoneSuggester} />
    <LocalisedField name="nationalityId" component={AutocompleteField} suggester={nationalitySuggester} />
    <LocalisedField name="ethnicityId" component={AutocompleteField} suggester={ethnicitySuggester} />
    <LocalisedField name="occupationId" component={AutocompleteField} suggester={occupationSuggester} />
    <LocalisedField name="educationalLevel" component={SelectField} options={educationalAttainmentOptions} />
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
