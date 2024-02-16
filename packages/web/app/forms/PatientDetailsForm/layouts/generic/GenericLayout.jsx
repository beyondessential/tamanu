import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import {
  LocalisedField,
  TextField,
  DateField,
  AutocompleteField,
  RadioField,
  FormGrid,
} from '../../../../components';
import styled from 'styled-components';
import { Colors } from '../../../../constants';
import { GenericLocationFields } from './patientFields/GenericLocationFields';
import { GenericContactFields } from './patientFields/GenericContactFields';
import { GenericIdentificationFields } from './patientFields/GenericIdentifiationFields';
import { GenericPersonalFields } from './patientFields/GenericPersonalFields';
import { GenericBirthFields } from './patientFields/GenericBirthFields';

export const PatientDetailsHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
`;

export const SecondaryDetailsGroup = styled.div`
  margin-top: 20px;
`;

export const SecondaryDetailsGroupWrapper = styled.div`
  margin-top: 70px;
`;

export const SecondaryDetailsFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;

export const GenericPrimaryDetailsLayout = ({
  values = {},
  patientRegistryType,
  countrySuggester,
  villageSuggester,
  divisionSuggester,
  settlementSuggester,
  medicalAreaSuggester,
  nursingZoneSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  occupationSuggester,
  religionSuggester,
  patientSuggester,
  facilitySuggester,
  sexOptions,
  isRequiredPatientData,
}) => (
  <>
    <PatientDetailsHeading>General information</PatientDetailsHeading>
    <FormGrid>
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField
        name="middleName"
        component={TextField}
        required={isRequiredPatientData('middleName')}
      />
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField
        name="culturalName"
        component={TextField}
        required={isRequiredPatientData('culturalName')}
      />
      <LocalisedField
        name="dateOfBirth"
        max={getCurrentDateTimeString()}
        component={DateField}
        required
        saveDateAsString
      />
      <LocalisedField
        name="villageId"
        component={AutocompleteField}
        suggester={villageSuggester}
        required={isRequiredPatientData('villageId')}
      />
      <LocalisedField name="sex" component={RadioField} options={sexOptions} required />
      <LocalisedField
        name="email"
        component={TextField}
        type="email"
        defaultLabel="Email address"
        required={isRequiredPatientData('email')}
      />
      {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
        <GenericBirthFields
          facilitySuggester={facilitySuggester}
          registeredBirthPlace={values.registeredBirthPlace}
          filterByMandatory
        />
      )}
      <GenericIdentificationFields patientRegistryType={patientRegistryType} filterByMandatory />
      <GenericContactFields filterByMandatory />
      <GenericPersonalFields
        countrySuggester={countrySuggester}
        ethnicitySuggester={ethnicitySuggester}
        nationalitySuggester={nationalitySuggester}
        occupationSuggester={occupationSuggester}
        religionSuggester={religionSuggester}
        patientSuggester={patientSuggester}
        patientRegistryType={patientRegistryType}
        filterByMandatory
      />
      <GenericLocationFields
        divisionSuggester={divisionSuggester}
        subdivisionSuggester={divisionSuggester}
        settlementSuggester={settlementSuggester}
        medicalAreaSuggester={medicalAreaSuggester}
        nursingZoneSuggester={nursingZoneSuggester}
        countrySuggester={countrySuggester}
        filterByMandatory
      />
    </FormGrid>
  </>
);

export const GenericSecondaryDetailsLayout = ({
  values = {},
  patientRegistryType,
  isEdit = false,
  subdivisionSuggester,
  divisionSuggester,
  settlementSuggester,
  medicalAreaSuggester,
  nursingZoneSuggester,
  ethnicitySuggester,
  nationalitySuggester,
  occupationSuggester,
  religionSuggester,
  patientSuggester,
  countrySuggester,
  facilitySuggester,
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
              filterByMandatory={false}
            />
          </SecondaryDetailsFormGrid>
        </>
      )}

      <PatientDetailsHeading>Identification information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <GenericIdentificationFields
          isEdit={isEdit}
          patientRegistryType={patientRegistryType}
          filterByMandatory={false}
        />
      </SecondaryDetailsFormGrid>

      <PatientDetailsHeading>Contact information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <GenericContactFields filterByMandatory={false} />
      </SecondaryDetailsFormGrid>

      <PatientDetailsHeading>Personal information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <GenericPersonalFields
          countrySuggester={countrySuggester}
          ethnicitySuggester={ethnicitySuggester}
          nationalitySuggester={nationalitySuggester}
          occupationSuggester={occupationSuggester}
          religionSuggester={religionSuggester}
          patientSuggester={patientSuggester}
          patientRegistryType={patientRegistryType}
          filterByMandatory={false}
        />
      </SecondaryDetailsFormGrid>

      <PatientDetailsHeading>Location information</PatientDetailsHeading>
      <SecondaryDetailsFormGrid>
        <GenericLocationFields
          subdivisionSuggester={subdivisionSuggester}
          divisionSuggester={divisionSuggester}
          settlementSuggester={settlementSuggester}
          medicalAreaSuggester={medicalAreaSuggester}
          nursingZoneSuggester={nursingZoneSuggester}
          countrySuggester={countrySuggester}
          filterByMandatory={false}
        />
      </SecondaryDetailsFormGrid>
    </SecondaryDetailsGroup>
  );
};
