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
import {
  PatientDetailsHeading,
  SecondaryDetailsFormGrid,
  SecondaryDetailsGroup,
} from '../../PatientDetailsCommonElements';
import { GenericLocationFields } from './patientFields/GenericLocationFields';
import { GenericContactFields } from './patientFields/GenericContactFields';
import { GenericIdentificationFields } from './patientFields/GenericIdentifiationFields';
import { GenericPersonalFields } from './patientFields/GenericPersonalFields';
import { GenericBirthFields } from './patientFields/GenericBirthFields';
import { useSuggester } from '../../../../api';
import { PatientFieldsGroup } from '../../PatientFields';

export const GenericPrimaryDetailsLayout = ({
  patientRegistryType,
  registeredBirthPlace,
  sexOptions,
  isRequiredPatientData,
}) => {
  const villageSuggester = useSuggester('village');
  return (
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
        <RequiredSecondaryDetails
          patientRegistryType={patientRegistryType}
          registeredBirthPlace={registeredBirthPlace}
        />
      </FormGrid>
    </>
  );
};

export const RequiredSecondaryDetails = ({ patientRegistryType, registeredBirthPlace }) => (
  <>
    {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
      <GenericBirthFields registeredBirthPlace={registeredBirthPlace} filterByMandatory />
    )}
    <GenericIdentificationFields patientRegistryType={patientRegistryType} filterByMandatory />
    <GenericContactFields filterByMandatory />
    <GenericPersonalFields patientRegistryType={patientRegistryType} filterByMandatory />
    <GenericLocationFields filterByMandatory />
  </>
);

export const GenericSecondaryDetailsLayout = ({
  registeredBirthPlace,
  patientRegistryType,
  isEdit = false,
}) => (
  <SecondaryDetailsGroup>
    {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
      <>
        <PatientDetailsHeading>Birth details</PatientDetailsHeading>
        <SecondaryDetailsFormGrid>
          <GenericBirthFields
            registeredBirthPlace={registeredBirthPlace}
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
      <GenericPersonalFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading>Location information</PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericLocationFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>
  </SecondaryDetailsGroup>
);

export const GenericPatientFieldLayout = ({ fieldDefinition, fieldValues }) => (
  <PatientFieldsGroup fieldDefinitions={fieldDefinition} fieldValues={fieldValues} />
);
