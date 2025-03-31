import React from 'react';

import { PATIENT_REGISTRY_TYPES, SETTING_KEYS, SEX_LABELS, SEX_VALUES } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

import {
  LocalisedField,
  TextField,
  DateField,
  AutocompleteField,
  FormGrid,
  TranslatedRadioField,
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
import { ReminderContactSection } from '../../../../components/ReminderContact/ReminderContactSection';
import { useSettings } from '../../../../contexts/Settings';

export const GenericPrimaryDetailsLayout = ({
  patientRegistryType,
  registeredBirthPlace,
  isRequiredPatientData,
  isDetailsForm = false,
}) => {
  const { getSetting } = useSettings();
  const isReminderContactEnabled = getSetting(SETTING_KEYS.FEATURES_REMINDER_CONTACT_ENABLED);
  const villageSuggester = useSuggester('village');
  const hideOtherSex = getSetting('features.hideOtherSex') === true;

  return (
    <>
      <PatientDetailsHeading>
        <TranslatedText
          stringId="patient.detail.subheading.general"
          fallback="General information"
          data-test-id='translatedtext-s3im' />
        {isReminderContactEnabled && isDetailsForm && <ReminderContactSection />}
      </PatientDetailsHeading>
      <FormGrid>
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-test-id='translatedtext-ezwh' />
          }
          component={TextField}
          required
          enablePasting
          data-test-id='localisedfield-0c8i' />
        <LocalisedField
          name="middleName"
          label={
            <TranslatedText
              stringId="general.localisedField.middleName.label"
              fallback="Middle name"
              data-test-id='translatedtext-2fi6' />
          }
          component={TextField}
          required={isRequiredPatientData('middleName')}
          enablePasting
          data-test-id='localisedfield-ngxf' />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-test-id='translatedtext-a6ke' />
          }
          component={TextField}
          required
          enablePasting
          data-test-id='localisedfield-g6iq' />
        <LocalisedField
          name="culturalName"
          label={
            <TranslatedText
              stringId="general.localisedField.culturalName.label"
              fallback="Cultural/traditional name"
              data-test-id='translatedtext-w6lb' />
          }
          component={TextField}
          required={isRequiredPatientData('culturalName')}
          enablePasting
          data-test-id='localisedfield-u3ld' />
        <LocalisedField
          name="dateOfBirth"
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label"
              fallback="Date of birth"
              data-test-id='translatedtext-g8z8' />
          }
          max={getCurrentDateString()}
          component={DateField}
          required
          saveDateAsString
          data-test-id='localisedfield-u1hf' />
        <LocalisedField
          name="villageId"
          label={
            <TranslatedText
              stringId="general.localisedField.villageId.label"
              fallback="Village"
              data-test-id='translatedtext-9eqf' />
          }
          component={AutocompleteField}
          suggester={villageSuggester}
          required={isRequiredPatientData('villageId')}
          data-test-id='localisedfield-r6sf' />
        <LocalisedField
          name="sex"
          label={<TranslatedText
            stringId="general.localisedField.sex.label"
            fallback="Sex"
            data-test-id='translatedtext-g390' />}
          component={TranslatedRadioField}
          enumValues={SEX_LABELS}
          transformOptions={options =>
            hideOtherSex ? options.filter(o => o.value !== SEX_VALUES.OTHER) : options
          }
          required
          data-test-id='localisedfield-ydtu' />
        <LocalisedField
          name="email"
          label={
            <TranslatedText
              stringId="general.localisedField.email.label"
              fallback="Email address"
              data-test-id='translatedtext-64j2' />
          }
          component={TextField}
          type="email"
          required={isRequiredPatientData('email')}
          enablePasting
          data-test-id='localisedfield-bazk' />
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
            data-test-id='translatedtext-pm8y' />
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
        data-test-id='translatedtext-hier' />
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
        data-test-id='translatedtext-gppq' />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericContactFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading>
      <TranslatedText
        stringId="patient.detail.subheading.personalInformation"
        fallback="Personal information"
        data-test-id='translatedtext-n5xv' />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericPersonalFields
        patientRegistryType={patientRegistryType}
        filterByMandatory={false}
        isEdit={isEdit}
      />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading>
      <TranslatedText
        stringId="patient.detail.subheading.locationInformation"
        fallback="Location information"
        data-test-id='translatedtext-v7gr' />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid>
      <GenericLocationFields filterByMandatory={false} />
    </SecondaryDetailsFormGrid>
  </SecondaryDetailsGroup>
);

export const GenericPatientFieldLayout = ({ fieldDefinitions, fieldValues }) => (
  <PatientFieldsGroup fieldDefinitions={fieldDefinitions} fieldValues={fieldValues} />
);
