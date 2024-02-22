import React from 'react';

import { PATIENT_FIELD_DEFINITION_TYPES, PATIENT_REGISTRY_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { LocalisedField, TextField, DateField, RadioField, FormGrid } from '../../../../components';
import {
  PatientDetailsHeading,
  SecondaryDetailsFormGrid,
  SecondaryDetailsGroup,
} from '../../PatientDetailsCommonElements';
import { CambodiaLocationFields } from './patientFields/CambodiaLocationFields';
import { CambodiaContactFields } from './patientFields/CambodiaContactFields';
import { CambodiaIdentificationFields } from './patientFields/CambodiaIdentificationFields';
import { CambodiaPersonalFields } from './patientFields/CambodiaPersonalFields';
import { GenericBirthFields } from '../generic/patientFields/GenericBirthFields';
import { PatientField, PatientFieldsGroup } from '../../PatientFields';

const FATHERS_FIRST_NAME_DEFINITION_ID = 'fieldDefinition-fathersFirstName';

const CAMBODIA_CORE_FIELD_CATEGORY_ID = 'fieldCategory-cambodiaCorePatientFields';

export const CambodiaPrimaryDetailsLayout = ({ sexOptions, isRequiredPatientData }) => (
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
      <PatientField
        definition={{
          name: "Father's first name",
          definitionId: FATHERS_FIRST_NAME_DEFINITION_ID,
          fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        }}
      />
    </FormGrid>
  </>
);

export const CambodiaSecondaryDetailsLayout = ({ values = {}, patientRegistryType, className }) => {
  return (
    <div className={className}>
      <SecondaryDetailsGroup>
        {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
          <>
            <PatientDetailsHeading>Birth details</PatientDetailsHeading>
            <SecondaryDetailsFormGrid>
              <GenericBirthFields registeredBirthPlace={values.registeredBirthPlace} />
            </SecondaryDetailsFormGrid>
          </>
        )}

        <PatientDetailsHeading>Current address</PatientDetailsHeading>
        <SecondaryDetailsFormGrid>
          <CambodiaLocationFields />
        </SecondaryDetailsFormGrid>

        <PatientDetailsHeading>Contact information</PatientDetailsHeading>
        <SecondaryDetailsFormGrid>
          <CambodiaContactFields />
        </SecondaryDetailsFormGrid>

        <PatientDetailsHeading>Identification information</PatientDetailsHeading>
        <SecondaryDetailsFormGrid>
          <CambodiaIdentificationFields patientRegistryType={patientRegistryType} />
        </SecondaryDetailsFormGrid>

        <PatientDetailsHeading>Personal information</PatientDetailsHeading>
        <SecondaryDetailsFormGrid>
          <CambodiaPersonalFields patientRegistryType={patientRegistryType} />
        </SecondaryDetailsFormGrid>
      </SecondaryDetailsGroup>
    </div>
  );
};

export const CambodiaPatientFieldLayout = ({ fieldDefinitions, fieldValues }) => {
  const filteredDefinitions = fieldDefinitions.filter(
    field => field.categoryId !== CAMBODIA_CORE_FIELD_CATEGORY_ID,
  );
  return <PatientFieldsGroup fieldDefinitions={filteredDefinitions} fieldValues={fieldValues} />;
};
