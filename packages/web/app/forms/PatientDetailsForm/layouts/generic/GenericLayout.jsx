import React from 'react';

import { PATIENT_REGISTRY_TYPES, SETTING_KEYS, SEX_LABELS, SEX_VALUES } from '@tamanu/constants';

import {
  LocalisedField,
  DateField,
  AutocompleteField,
  TranslatedRadioField,
  NoteModalActionBlocker,
} from '../../../../components';
import { TextField, FormGrid, useDateTime } from '@tamanu/ui-components';
import { PatientDetailsHeading, SecondaryDetailsGroup } from '../../PatientDetailsCommonElements';
import { GenericLocationFields } from './patientFields/GenericLocationFields';
import { GenericContactFields } from './patientFields/GenericContactFields';
import { GenericIdentificationFields } from './patientFields/GenericIdentifiationFields';
import { GenericPersonalFields } from './patientFields/GenericPersonalFields';
import { GenericBirthFields } from './patientFields/GenericBirthFields';
import { GenericBillingFields } from './patientFields/GenericBillingFields';
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
  const { getCurrentDate } = useDateTime();
  const { getSetting } = useSettings();
  const isReminderContactEnabled = getSetting(SETTING_KEYS.FEATURES_REMINDER_CONTACT_ENABLED);
  const villageSuggester = useSuggester('village');
  const hideOtherSex = getSetting('features.hideOtherSex') === true;
  const isUsingLocationHierarchy = getSetting('features.patientDetailsLocationHierarchy');

  return (
    <>
      <PatientDetailsHeading data-testid="patientdetailsheading-3ftw">
        <TranslatedText
          stringId="patient.detail.subheading.general"
          fallback="General information"
          data-testid="translatedtext-rfsz"
        />
        {isReminderContactEnabled && isDetailsForm && (
          <ReminderContactSection data-testid="remindercontactsection-q5m4" />
        )}
      </PatientDetailsHeading>
      <FormGrid data-testid="formgrid-y53s">
        <NoteModalActionBlocker>
          <LocalisedField
            name="firstName"
            label={
              <TranslatedText
                stringId="general.localisedField.firstName.label"
                fallback="First name"
                data-testid="translatedtext-cfge"
              />
            }
            component={TextField}
            required
            enablePasting
            data-testid="localisedfield-cqua"
          />
          <LocalisedField
            name="middleName"
            label={
              <TranslatedText
                stringId="general.localisedField.middleName.label"
                fallback="Middle name"
                data-testid="translatedtext-cwye"
              />
            }
            component={TextField}
            required={isRequiredPatientData('middleName')}
            enablePasting
            data-testid="localisedfield-l6hc"
          />
          <LocalisedField
            name="lastName"
            label={
              <TranslatedText
                stringId="general.localisedField.lastName.label"
                fallback="Last name"
                data-testid="translatedtext-xgre"
              />
            }
            component={TextField}
            required
            enablePasting
            data-testid="localisedfield-41un"
          />
          <LocalisedField
            name="culturalName"
            label={
              <TranslatedText
                stringId="general.localisedField.culturalName.label"
                fallback="Cultural/traditional name"
                data-testid="translatedtext-reeu"
              />
            }
            component={TextField}
            required={isRequiredPatientData('culturalName')}
            enablePasting
            data-testid="localisedfield-ew4s"
          />
          <LocalisedField
            name="dateOfBirth"
            label={
              <TranslatedText
                stringId="general.localisedField.dateOfBirth.label"
                fallback="Date of birth"
                data-testid="translatedtext-o7gm"
              />
            }
            max={getCurrentDate()}  
            component={DateField}
            required
            data-testid="localisedfield-oafl"
          />

          {!isUsingLocationHierarchy && (
            <LocalisedField
              name="villageId"
              label={
                <TranslatedText
                  stringId="general.localisedField.villageId.label"
                  fallback="Village"
                />
              }
              component={AutocompleteField}
              suggester={villageSuggester}
              required={isRequiredPatientData('villageId')}
              data-testid="localisedfield-rpma"
            />
          )}
          <LocalisedField
            name="sex"
            label={
              <TranslatedText
                stringId="general.localisedField.sex.label"
                fallback="Sex"
                data-testid="translatedtext-sjf3"
              />
            }
            component={TranslatedRadioField}
            enumValues={SEX_LABELS}
            transformOptions={options =>
              hideOtherSex ? options.filter(o => o.value !== SEX_VALUES.OTHER) : options
            }
            required
            data-testid="localisedfield-aial"
          />
          <LocalisedField
            name="email"
            label={
              <TranslatedText
                stringId="general.localisedField.email.label"
                fallback="Email address"
                data-testid="translatedtext-vxqk"
              />
            }
            component={TextField}
            type="email"
            required={isRequiredPatientData('email')}
            enablePasting
            data-testid="localisedfield-j8v5"
          />
          <RequiredSecondaryDetails
            patientRegistryType={patientRegistryType}
            registeredBirthPlace={registeredBirthPlace}
            data-testid="requiredsecondarydetails-xpxc"
          />
        </NoteModalActionBlocker>
      </FormGrid>
    </>
  );
};

export const RequiredSecondaryDetails = ({ patientRegistryType, registeredBirthPlace }) => (
  <>
    {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
      <GenericBirthFields
        registeredBirthPlace={registeredBirthPlace}
        filterByMandatory
        data-testid="genericbirthfields-3uda"
      />
    )}
    <GenericIdentificationFields
      patientRegistryType={patientRegistryType}
      filterByMandatory
      data-testid="genericidentificationfields-k0vj"
    />
    <GenericContactFields filterByMandatory data-testid="genericcontactfields-3c7t" />
    <GenericPersonalFields
      patientRegistryType={patientRegistryType}
      filterByMandatory
      data-testid="genericpersonalfields-m1dc"
    />
    <GenericLocationFields filterByMandatory data-testid="genericlocationfields-8w9p" />
    <GenericBillingFields filterByMandatory data-testid="genericbillingfields-x11b" />
  </>
);

export const GenericSecondaryDetailsLayout = ({
  registeredBirthPlace,
  patientRegistryType,
  isEdit = false,
}) => (
  <SecondaryDetailsGroup data-testid="secondarydetailsgroup-s246">
    {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
      <GenericBirthFields
        registeredBirthPlace={registeredBirthPlace}
        filterByMandatory={false}
        heading={
          <TranslatedText
            stringId="patient.detail.subheading.birthDetails"
            fallback="Birth details"
            data-testid="translatedtext-w4iq"
          />
        }
        data-testid="genericbirthfields-3wv2"
      />
    )}

    <GenericIdentificationFields
      isEdit={isEdit}
      patientRegistryType={patientRegistryType}
      filterByMandatory={false}
      heading={
        <TranslatedText
          stringId="patient.detail.subheading.identificationInformation"
          fallback="Identification information"
          data-testid="translatedtext-nskp"
        />
      }
      data-testid="genericidentificationfields-uh67"
    />

    <GenericContactFields
      filterByMandatory={false}
      heading={
        <TranslatedText
          stringId="patient.detail.subheading.contactInformation"
          fallback="Contact information"
          data-testid="translatedtext-tq75"
        />
      }
      data-testid="genericcontactfields-dfh4"
    />

    <GenericPersonalFields
      patientRegistryType={patientRegistryType}
      filterByMandatory={false}
      isEdit={isEdit}
      heading={
        <TranslatedText
          stringId="patient.detail.subheading.personalInformation"
          fallback="Personal information"
          data-testid="translatedtext-bc5w"
        />
      }
      data-testid="genericpersonalfields-hmrm"
    />

    <GenericLocationFields
      filterByMandatory={false}
      heading={
        <TranslatedText
          stringId="patient.detail.subheading.locationInformation"
          fallback="Location information"
          data-testid="translatedtext-wy6z"
        />
      }
      data-testid="genericlocationfields-z71v"
    />

    <GenericBillingFields
      filterByMandatory={false}
      heading={
        <TranslatedText
          stringId="patient.detail.subheading.billingInformation"
          fallback="Billing information"
        />
      }
      data-testid="genericbillingfields-x11a"
    />
  </SecondaryDetailsGroup>
);

export const GenericPatientFieldLayout = ({ fieldDefinitions, fieldValues }) => (
  <PatientFieldsGroup
    fieldDefinitions={fieldDefinitions}
    fieldValues={fieldValues}
    data-testid="patientfieldsgroup-rspx"
  />
);
