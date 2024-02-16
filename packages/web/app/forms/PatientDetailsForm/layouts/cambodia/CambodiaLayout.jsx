import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { LocalisedField, TextField, DateField, RadioField, FormGrid } from '../../../../components';
import {
  PatientDetailsHeading,
  SecondaryDetailsFormGrid,
  SecondaryDetailsGroup,
} from '../generic/GenericLayout';
import { CambodiaLocationFields } from './patientFields/CambodiaLocationFields';
import { CambodiaContactFields } from './patientFields/CambodiaContactFields';
import { CambodiaIdentificationFields } from './patientFields/CambodiaIdentificationFields';
import { CambodiaPersonalFields } from './patientFields/CambodiaPersonalFields';
import { GenericBirthFields } from '../generic/patientFields/GenericBirthFields';

export const CambodiaPrimaryDetailsLayout = ({
  values = {},
  patientRegistryType,
  nursingZoneSuggester,
  medicalAreaSuggester,
  villageSuggester,
  subdivisionSuggester,
  divisionSuggester,
  settlementSuggester,
  countrySuggester,
  nationalitySuggester,
  facilitySuggester,
  sexOptions,
  isRequiredPatientData,
}) => (
  <>
    <PatientDetailsHeading>General information</PatientDetailsHeading>
    <FormGrid>
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField
        name="dateOfBirth"
        max={getCurrentDateTimeString()}
        component={DateField}
        required
        saveDateAsString
      />
      <LocalisedField name="sex" component={RadioField} options={sexOptions} required />
      <LocalisedField
        name="culturalName"
        component={TextField}
        required={isRequiredPatientData('culturalName')}
      />
      <CambodiaLocationFields
        villageSuggester={villageSuggester}
        subdivisionSuggester={subdivisionSuggester}
        divisionSuggester={divisionSuggester}
        settlementSuggester={settlementSuggester}
      />
      <CambodiaContactFields
        nursingZoneSuggester={nursingZoneSuggester}
        medicalAreaSuggester={medicalAreaSuggester}
      />

      {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
        <GenericBirthFields facilitySuggester={facilitySuggester} registeredBirthPlace={values.registeredBirthPlace} />
      )}
      <CambodiaIdentificationFields patientRegistryType={patientRegistryType} />
      <CambodiaPersonalFields countrySuggester={countrySuggester} nationalitySuggester={nationalitySuggester} patientRegistryType={patientRegistryType} />
    </FormGrid>
  </>
);
export const CambodiaSecondaryDetailsLayout = ({
  values = {},
  countrySuggester,
  patientRegistryType,
  subdivisionSuggester,
  divisionSuggester,
  settlementSuggester,
  villageSuggester,
  nursingZoneSuggester,
  medicalAreaSuggester,
  nationalitySuggester,
  facilitySuggester
}) => {
  return (
    <SecondaryDetailsGroup>
      {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
        <>
          <PatientDetailsHeading>Birth details</PatientDetailsHeading>
          <SecondaryDetailsFormGrid>
            <GenericBirthFields
              facilitySuggester={facilitySuggester}
              registeredBirthPlace={values.registeredBirthPlace}
              showMandatory={false}
            />
          </SecondaryDetailsFormGrid>
        </>
      )}

      <PatientDetailsHeading>Current address</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <CambodiaLocationFields
          villageSuggester={villageSuggester}
          subdivisionSuggester={subdivisionSuggester}
          divisionSuggester={divisionSuggester}
          settlementSuggester={settlementSuggester}
          showMandatory={false}
        />
      </SecondaryDetailsFormGrid>

      <PatientDetailsHeading>Contact information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <CambodiaContactFields
          nursingZoneSuggester={nursingZoneSuggester}
          medicalAreaSuggester={medicalAreaSuggester}
          showMandatory={false}
        />
      </SecondaryDetailsFormGrid>

      <PatientDetailsHeading>Identification information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <CambodiaIdentificationFields
          patientRegistryType={patientRegistryType}
          showMandatory={false}
        />
      </SecondaryDetailsFormGrid>

      <PatientDetailsHeading>Personal information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <CambodiaPersonalFields
          countrySuggester={countrySuggester}
          nationalitySuggester={nationalitySuggester}
          patientRegistryType={patientRegistryType}
          showMandatory={false}
        />
      </SecondaryDetailsFormGrid>
    </SecondaryDetailsGroup>
  );
};
