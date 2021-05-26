import React from 'react';

import { connectApi } from '../api';
import { Suggester } from '../utils/suggester';

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

const DumbPrimaryDetailsGroup = ({ villageSuggester }) => (
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

export const PrimaryDetailsGroup = connectApi((api, dispatch, { patient }) => ({
  villageSuggester: new Suggester(api, 'village'),
}))(DumbPrimaryDetailsGroup);

const DumbSecondaryDetailsGroup = ({
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

export const SecondaryDetailsGroup = connectApi((api, dispatch, { patient }) => ({
  countrySuggester: new Suggester(api, 'country'),
  divisionSuggester: new Suggester(api, 'division'),
  ethnicitySuggester: new Suggester(api, 'ethnicity'),
  facilitySuggester: new Suggester(api, 'facility'),
  medicalAreaSuggester: new Suggester(api, 'medicalArea'),
  nationalitySuggester: new Suggester(api, 'nationality'),
  nursingZoneSuggester: new Suggester(api, 'nursingZone'),
  occupationSuggester: new Suggester(api, 'occupation'),
  settlementSuggester: new Suggester(api, 'settlement'),
  subdivisionSuggester: new Suggester(api, 'subdivision'),
}))(SecondaryDetailsGroup);

export const PatientDetailsForm = ({ patient, onSubmit }) => {
  const render = React.useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <PrimaryDetailsGroup />
        <SecondaryDetailsGroup />
        <ButtonRow>
          <Button variant="contained" color="primary" onClick={submitForm}>
            Save
          </Button>
        </ButtonRow>
      </FormGrid>
    ),
  );

  return (
    <Form
      render={render}
      initialValues={{ ...patient, ...patient.additionalData }}
      onSubmit={onSubmit}
    />
  );
};
