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
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ReminderContactSection } from '../../../../components/ReminderContactSection';

export const GenericPrimaryDetailsLayout = ({
  patientRegistryType,
  registeredBirthPlace,
  sexOptions,
  isRequiredPatientData,
}) => {
  const villageSuggester = useSuggester('village');
  return (
    <>
      <PatientDetailsHeading>
        <TranslatedText
          stringId="patient.detail.subheading.general"
          fallback="General information"
        />
        <ReminderContactSection />
      </PatientDetailsHeading>
      <FormGrid>
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
            />
          }
          component={TextField}
          required
        />
        <LocalisedField
          name="middleName"
          label={
            <TranslatedText
              stringId="general.localisedField.middleName.label"
              fallback="Middle name"
            />
          }
          component={TextField}
          required={isRequiredPatientData('middleName')}
        />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
          }
          component={TextField}
          required
        />
        <LocalisedField
          name="culturalName"
          label={
            <TranslatedText
              stringId="general.localisedField.culturalName.label"
              fallback="Cultural/traditional name"
            />
          }
          component={TextField}
          required={isRequiredPatientData('culturalName')}
        />
        <LocalisedField
          name="dateOfBirth"
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label"
              fallback="Date of birth"
            />
          }
          max={getCurrentDateTimeString()}
          component={DateField}
          required
          saveDateAsString
        />
        <LocalisedField
          name="villageId"
          label={
            <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
          }
          component={AutocompleteField}
          suggester={villageSuggester}
          required={isRequiredPatientData('villageId')}
        />
        <LocalisedField
          name="sex"
          label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
          component={RadioField}
          options={sexOptions}
          required
        />
        <LocalisedField
          name="email"
          label={
            <TranslatedText
              stringId="general.localisedField.email.label"
              fallback="Email address"
            />
          }
          component={TextField}
          type="email"
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
        <PatientDetailsHeading>
          <TranslatedText
            stringId="patient.detail.subheading.birthDetails"
            fallback="Birth details"
          />
        </PatientDetailsHeading>
        <SecondaryDetailsFormGrid>
          <GenericBirthFields
            registeredBirthPlace={registeredBirthPlace}
            filterByMandatory={false}
          />
        </SecondaryDetailsFormGrid>
      </>
    )}

    <PatientDetailsHeading>
      <TranslatedText
        stringId="patient.detail.subheading.identificationInformation"
        fallback="Identification information"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericIdentificationFields
        isEdit={isEdit}
        patientRegistryType={patientRegistryType}
        filterByMandatory={false}
      />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading>
      <TranslatedText
        stringId="patient.detail.subheading.contactInformation"
        fallback="Contact information"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericContactFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading>
      <TranslatedText
        stringId="patient.detail.subheading.personalInformation"
        fallback="Personal information"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericPersonalFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading>
      <TranslatedText
        stringId="patient.detail.subheading.locationInformation"
        fallback="Location information"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericLocationFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>
  </SecondaryDetailsGroup>
);

export const GenericPatientFieldLayout = ({ fieldDefinition, fieldValues }) => (
  <PatientFieldsGroup fieldDefinitions={fieldDefinition} fieldValues={fieldValues} />
);
