import React from 'react';

import { FormGrid } from '../components/FormGrid';
import { ButtonRow } from '../components/ButtonRow';
import { Button } from '../components/Button';

import {
  Form,
  FlagField,
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
    <FlagField name="firstName" component={TextField} required />
    <FlagField name="middleName" component={TextField} />
    <FlagField name="lastName" component={TextField} required />
    <FlagField name="culturalName" component={TextField} />
    <FlagField name="dateOfBirth" component={DateField} required />
    <FlagField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
    <FlagField name="sex" component={RadioField} options={sexOptions} inline required />
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
    <FlagField name="bloodType" component={SelectField} options={bloodOptions} />
    <FlagField name="title" component={SelectField} options={titleOptions} />
    <FlagField name="placeOfBirth" component={TextField} />
    <FlagField name="maritalStatus" component={SelectField} options={maritalStatusOptions} />
    <FlagField name="primaryContactNumber" component={TextField} type="tel" />
    <FlagField name="secondaryContactNumber" component={TextField} type="tel" />
    <FlagField name="socialMedia" component={SelectField} options={socialMediaOptions} />
    <FlagField name="settlementId" component={AutocompleteField} suggester={settlementSuggester} />
    <FlagField name="streetVillage" component={TextField} />
    <FlagField name="cityTown" component={TextField} />
    <FlagField name="subdivisionId" component={AutocompleteField} suggester={subdivisionSuggester} />
    <FlagField name="divisionId" component={AutocompleteField} suggester={divisionSuggester} />
    <FlagField name="countryId" component={AutocompleteField} suggester={countrySuggester} />
    <FlagField name="medicalAreaId" component={AutocompleteField} suggester={medicalAreaSuggester} />
    <FlagField name="nursingZoneId" component={AutocompleteField} suggester={nursingZoneSuggester} />
    <FlagField name="nationalityId" component={AutocompleteField} suggester={nationalitySuggester} />
    <FlagField name="ethnicityId" component={AutocompleteField} suggester={ethnicitySuggester} />
    <FlagField name="occupationId" component={AutocompleteField} suggester={occupationSuggester} />
    <FlagField name="educationalLevel" component={SelectField} options={educationalAttainmentOptions} />
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
