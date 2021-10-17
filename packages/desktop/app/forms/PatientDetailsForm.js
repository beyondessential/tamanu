import React from 'react';

import { useLocalisation } from '../contexts/Localisation';
import { useApi } from '../api';
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

export const PrimaryDetailsGroup = () => {
  const api = useApi();
  const villageSuggester = new Suggester(api, 'village');
  const { getLocalisation } = useLocalisation();
  let filteredSexOptions = sexOptions;
  if (getLocalisation('features.hideOtherSex') === true) {
    filteredSexOptions = filteredSexOptions.filter(s => s.value !== 'other');
  }

  return (
    <React.Fragment>
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField name="middleName" component={TextField} />
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField name="culturalName" component={TextField} />
      <LocalisedField name="dateOfBirth" component={DateField} required />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <LocalisedField
        name="sex"
        component={RadioField}
        options={filteredSexOptions}
        inline
        required
      />
    </React.Fragment>
  );
};

export const SecondaryDetailsGroup = () => {
  const api = useApi();
  const countrySuggester = new Suggester(api, 'country');
  const divisionSuggester = new Suggester(api, 'division');
  const ethnicitySuggester = new Suggester(api, 'ethnicity');
  const medicalAreaSuggester = new Suggester(api, 'medicalArea');
  const nationalitySuggester = new Suggester(api, 'nationality');
  const nursingZoneSuggester = new Suggester(api, 'nursingZone');
  const occupationSuggester = new Suggester(api, 'occupation');
  const settlementSuggester = new Suggester(api, 'settlement');
  const subdivisionSuggester = new Suggester(api, 'subdivision');
  const religionSuggester = new Suggester(api, 'religion');
  const patientBillingTypeSuggester = new Suggester(api, 'patientBillingType');
  return (
    <>
      <LocalisedField name="birthCertificate" component={TextField} />
      <LocalisedField name="drivingLicense" component={TextField} />
      <LocalisedField name="passport" component={TextField} />
      <LocalisedField name="bloodType" component={SelectField} options={bloodOptions} />
      <LocalisedField name="title" component={SelectField} options={titleOptions} />
      <LocalisedField name="placeOfBirth" component={TextField} />
      <LocalisedField
        name="countryOfBirthId"
        component={AutocompleteField}
        suggester={countrySuggester}
      />
      <LocalisedField name="maritalStatus" component={SelectField} options={maritalStatusOptions} />
      <LocalisedField name="primaryContactNumber" component={TextField} type="tel" />
      <LocalisedField name="secondaryContactNumber" component={TextField} type="tel" />
      <LocalisedField name="socialMedia" component={SelectField} options={socialMediaOptions} />
      <LocalisedField
        name="settlementId"
        component={AutocompleteField}
        suggester={settlementSuggester}
      />
      <LocalisedField name="streetVillage" component={TextField} />
      <LocalisedField name="cityTown" component={TextField} />
      <LocalisedField
        name="subdivisionId"
        component={AutocompleteField}
        suggester={subdivisionSuggester}
      />
      <LocalisedField
        name="divisionId"
        component={AutocompleteField}
        suggester={divisionSuggester}
      />
      <LocalisedField name="countryId" component={AutocompleteField} suggester={countrySuggester} />
      <LocalisedField
        name="medicalAreaId"
        component={AutocompleteField}
        suggester={medicalAreaSuggester}
      />
      <LocalisedField
        name="nursingZoneId"
        component={AutocompleteField}
        suggester={nursingZoneSuggester}
      />
      <LocalisedField
        name="nationalityId"
        component={AutocompleteField}
        suggester={nationalitySuggester}
      />
      <LocalisedField
        name="ethnicityId"
        component={AutocompleteField}
        suggester={ethnicitySuggester}
      />
      <LocalisedField
        name="occupationId"
        component={AutocompleteField}
        suggester={occupationSuggester}
      />
      <LocalisedField
        name="educationalLevel"
        component={SelectField}
        options={educationalAttainmentOptions}
      />
      <LocalisedField
        name="religionId"
        component={AutocompleteField}
        suggester={religionSuggester}
      />
      <LocalisedField
        name="patientBillingTypeId"
        component={AutocompleteField}
        suggester={patientBillingTypeSuggester}
      />
    </>
  );
};

function sanitiseRecordForValues(data) {
  const {
    // unwanted ids
    id,
    patientId,

    // backend fields
    markedForPush,
    markedForSync,
    createdAt,
    updatedAt,
    pushedAt,
    pulledAt,

    // state fields
    loading,
    error,

    ...remaining
  } = data;

  return Object.entries(remaining)
    .filter(([k, v]) => {
      if (Array.isArray(v)) return false;
      if (typeof v === 'object') return false;
      return true;
    })
    .reduce((state, [k, v]) => ({ ...state, [k]: v }), {});
}

function stripPatientData(patient) {
  // The patient object includes the entirety of patient state, not just the
  // fields on the db record, and whatever we pass to initialValues will get
  // sent on to the server if it isn't modified by a field on the form.
  // So, we strip that out here.

  return {
    ...sanitiseRecordForValues(patient),
    ...sanitiseRecordForValues(patient.additionalData),
  };
}

export const PatientDetailsForm = ({ patient, onSubmit }) => {
  const render = React.useCallback(({ submitForm }) => (
    <FormGrid>
      <PrimaryDetailsGroup />
      <SecondaryDetailsGroup />
      <ButtonRow>
        <Button variant="contained" color="primary" onClick={submitForm}>
          Save
        </Button>
      </ButtonRow>
    </FormGrid>
  ));

  return <Form render={render} initialValues={stripPatientData(patient)} onSubmit={onSubmit} />;
};
