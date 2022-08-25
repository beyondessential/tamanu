import React from 'react';

import { format } from 'date-fns';
import { useLocalisation } from '../contexts/Localisation';
import { useSuggester } from '../api';
import {
  FormGrid,
  ButtonRow,
  Button,
  Form,
  LocalisedField,
  DateField,
  AutocompleteField,
  TextField,
  RadioField,
  SelectField,
  SuggesterSelectField,
} from '../components';
import {
  sexOptions,
  bloodOptions,
  titleOptions,
  socialMediaOptions,
  maritalStatusOptions,
  educationalAttainmentOptions,
} from '../constants';

export const PrimaryDetailsGroup = () => {
  const villageSuggester = useSuggester('village');
  const { getLocalisation } = useLocalisation();
  let filteredSexOptions = sexOptions;
  if (getLocalisation('features.hideOtherSex') === true) {
    filteredSexOptions = filteredSexOptions.filter(s => s.value !== 'other');
  }

  return (
    <>
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField name="middleName" component={TextField} />
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField name="culturalName" component={TextField} />
      <LocalisedField
        name="dateOfBirth"
        max={format(new Date(), 'yyyy-MM-dd')}
        component={DateField}
        required
      />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <LocalisedField name="sex" component={RadioField} options={filteredSexOptions} required />
      <LocalisedField
        name="email"
        component={TextField}
        type="email"
        defaultLabel="Email address"
      />
    </>
  );
};

export const SecondaryDetailsGroup = () => {
  const countrySuggester = useSuggester('country');
  const divisionSuggester = useSuggester('division');
  const ethnicitySuggester = useSuggester('ethnicity');
  const medicalAreaSuggester = useSuggester('medicalArea');
  const nationalitySuggester = useSuggester('nationality');
  const nursingZoneSuggester = useSuggester('nursingZone');
  const occupationSuggester = useSuggester('occupation');
  const settlementSuggester = useSuggester('settlement');
  const subdivisionSuggester = useSuggester('subdivision');
  const religionSuggester = useSuggester('religion');

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
        endpoint="patientBillingType"
        component={SuggesterSelectField}
      />
      <LocalisedField name="emergencyContactName" component={TextField} />
      <LocalisedField name="emergencyContactNumber" component={TextField} type="tel" />
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
    .filter(([, v]) => {
      if (Array.isArray(v)) return false;
      if (typeof v === 'object') return false;
      return true;
    })
    .reduce((state, [k, v]) => ({ ...state, [k]: v }), {});
}

function stripPatientData(patient, additionalData) {
  // The patient object includes the entirety of patient state, not just the
  // fields on the db record, and whatever we pass to initialValues will get
  // sent on to the server if it isn't modified by a field on the form.
  // So, we strip that out here.

  return {
    ...sanitiseRecordForValues(patient),
    ...sanitiseRecordForValues(additionalData),
  };
}

export const PatientDetailsForm = ({ patient, additionalData, onSubmit }) => (
  <Form
    render={({ submitForm }) => (
      <FormGrid>
        <PrimaryDetailsGroup />
        <SecondaryDetailsGroup />
        <ButtonRow>
          <Button variant="contained" color="primary" onClick={submitForm}>
            Save
          </Button>
        </ButtonRow>
      </FormGrid>
    )}
    initialValues={stripPatientData(patient, additionalData)}
    onSubmit={onSubmit}
  />
);
