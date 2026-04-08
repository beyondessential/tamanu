import React, { useMemo } from 'react';

import {
  PATIENT_FIELD_SECTIONS,
  PATIENT_REGISTRY_TYPES,
  SETTING_KEYS,
  SEX_LABELS,
  SEX_VALUES,
} from '@tamanu/constants';

import {
  LocalisedField,
  DateField,
  AutocompleteField,
  TranslatedRadioField,
  NoteModalActionBlocker,
} from '../../../../components';
import { TextField, FormGrid, useDateTime } from '@tamanu/ui-components';
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
import { usePatientFieldLayoutOrder } from '../../usePatientFieldLayoutOrder';

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
  const { orderByFieldKeyBySection } = usePatientFieldLayoutOrder();
  const orderByFieldKey = orderByFieldKeyBySection?.get(PATIENT_FIELD_SECTIONS.GENERAL_INFORMATION) ?? null;

  // Define primary fields as an array so they can be sorted by layout order
  const primaryFields = useMemo(() => {
    const fields = [
      {
        name: 'firstName',
        element: (
          <LocalisedField
            key="firstName"
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
        ),
      },
      {
        name: 'middleName',
        element: (
          <LocalisedField
            key="middleName"
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
        ),
      },
      {
        name: 'lastName',
        element: (
          <LocalisedField
            key="lastName"
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
        ),
      },
      {
        name: 'culturalName',
        element: (
          <LocalisedField
            key="culturalName"
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
        ),
      },
      {
        name: 'dateOfBirth',
        element: (
          <LocalisedField
            key="dateOfBirth"
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
        ),
      },
      ...(!isUsingLocationHierarchy
        ? [
            {
              name: 'villageId',
              element: (
                <LocalisedField
                  key="villageId"
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
              ),
            },
          ]
        : []),
      {
        name: 'sex',
        element: (
          <LocalisedField
            key="sex"
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
        ),
      },
      {
        name: 'email',
        element: (
          <LocalisedField
            key="email"
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
        ),
      },
    ];

    if (orderByFieldKey) {
      fields.sort((a, b) => {
        const orderA = orderByFieldKey.get(a.name) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderByFieldKey.get(b.name) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    }

    return fields;
  }, [
    isRequiredPatientData,
    getCurrentDate,
    isUsingLocationHierarchy,
    villageSuggester,
    hideOtherSex,
    orderByFieldKey,
  ]);

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
          {primaryFields.map(field => field.element)}
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
  </>
);

export const GenericSecondaryDetailsLayout = ({
  registeredBirthPlace,
  patientRegistryType,
  isEdit = false,
}) => (
  <SecondaryDetailsGroup data-testid="secondarydetailsgroup-s246">
    {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
      <>
        <PatientDetailsHeading data-testid="patientdetailsheading-u9ma">
          <TranslatedText
            stringId="patient.detail.subheading.birthDetails"
            fallback="Birth details"
            data-testid="translatedtext-w4iq"
          />
        </PatientDetailsHeading>
        <SecondaryDetailsFormGrid data-testid="secondarydetailsformgrid-zpjh">
          <GenericBirthFields
            registeredBirthPlace={registeredBirthPlace}
            filterByMandatory={false}
            data-testid="genericbirthfields-3wv2"
          />
        </SecondaryDetailsFormGrid>
      </>
    )}

    <PatientDetailsHeading data-testid="patientdetailsheading-hkyy">
      <TranslatedText
        stringId="patient.detail.subheading.identificationInformation"
        fallback="Identification information"
        data-testid="translatedtext-nskp"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid data-testid="secondarydetailsformgrid-8o1s">
      <GenericIdentificationFields
        isEdit={isEdit}
        patientRegistryType={patientRegistryType}
        filterByMandatory={false}
        data-testid="genericidentificationfields-uh67"
      />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading data-testid="patientdetailsheading-pipb">
      <TranslatedText
        stringId="patient.detail.subheading.contactInformation"
        fallback="Contact information"
        data-testid="translatedtext-tq75"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid data-testid="secondarydetailsformgrid-g8w7">
      <GenericContactFields filterByMandatory={false} data-testid="genericcontactfields-dfh4" />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading data-testid="patientdetailsheading-vd0y">
      <TranslatedText
        stringId="patient.detail.subheading.personalInformation"
        fallback="Personal information"
        data-testid="translatedtext-bc5w"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid data-testid="secondarydetailsformgrid-qrkb">
      <GenericPersonalFields
        patientRegistryType={patientRegistryType}
        filterByMandatory={false}
        isEdit={isEdit}
        data-testid="genericpersonalfields-hmrm"
      />
    </SecondaryDetailsFormGrid>

    <PatientDetailsHeading data-testid="patientdetailsheading-ccov">
      <TranslatedText
        stringId="patient.detail.subheading.locationInformation"
        fallback="Location information"
        data-testid="translatedtext-wy6z"
      />
    </PatientDetailsHeading>
    <SecondaryDetailsFormGrid data-testid="secondarydetailsformgrid-x46r">
      <GenericLocationFields filterByMandatory={false} data-testid="genericlocationfields-z71v" />
    </SecondaryDetailsFormGrid>
  </SecondaryDetailsGroup>
);

export const GenericPatientFieldLayout = ({ fieldDefinitions, fieldValues }) => (
  <PatientFieldsGroup
    fieldDefinitions={fieldDefinitions}
    fieldValues={fieldValues}
    data-testid="patientfieldsgroup-rspx"
  />
);
