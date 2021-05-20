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

import { PatientField } from './PatientField';

export const PrimaryDetailsGroup = ({ villageSuggester }) => (
  <React.Fragment>
    <PatientField name="firstName" component={TextField} required />
    <PatientField name="middleName" component={TextField} />
    <PatientField name="lastName" component={TextField} required />
    <PatientField name="culturalName" component={TextField} />
    <PatientField name="dateOfBirth" component={DateField} required />
    <PatientField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
    <PatientField name="sex" component={RadioField} options={sexOptions} inline required />
  </React.Fragment>
);

export const SecondaryDetailsGroup = ({
  medicalAreaSuggester,
  nursingZoneSuggester,
  settlementSuggester,
  occupationSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  divisionSuggester,
  subdivisionSuggester,
}) => (
  <React.Fragment>
    <PatientField name="bloodType" component={SelectField} options={bloodOptions} />
    <PatientField name="title" component={SelectField} options={titleOptions} />
    <PatientField name="placeOfBirth" component={TextField} />
    <PatientField name="maritalStatus" component={SelectField} options={maritalStatusOptions} />
    <PatientField name="primaryContactNumber" component={TextField} type="tel" />
    <PatientField name="secondaryContactNumber" component={TextField} type="tel" />
    <PatientField name="socialMedia" component={SelectField} options={socialMediaOptions} />
    <PatientField name="settlementId" component={AutocompleteField} suggester={settlementSuggester} />
    <PatientField name="streetVillage" component={TextField} />
    <PatientField name="cityTown" component={TextField} />
    <PatientField name="subdivisionId" component={AutocompleteField} suggester={subdivisionSuggester} />
    <PatientField name="divisionId" component={AutocompleteField} suggester={divisionSuggester} />
    <PatientField name="countryId" component={AutocompleteField} suggester={nationalitySuggester} />
    <PatientField name="medicalAreaId" component={AutocompleteField} suggester={medicalAreaSuggester} />
    <PatientField name="nursingZoneId" component={AutocompleteField} suggester={nursingZoneSuggester} />
    <PatientField name="nationalityId" component={AutocompleteField} suggester={nationalitySuggester} />
    <PatientField name="ethnicityId" component={AutocompleteField} suggester={ethnicitySuggester} />
    <PatientField name="occupationId" component={AutocompleteField} suggester={occupationSuggester} />
    <PatientField name="educationalLevel" component={SelectField} options={educationalAttainmentOptions} />
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

  return (
    <Form
      render={render}
      initialValues={{ ...patient, ...patient.additionalData }}
      onSubmit={onSubmit}
    />
  );
};
