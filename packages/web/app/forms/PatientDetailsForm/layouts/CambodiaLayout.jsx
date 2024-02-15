import React from 'react';

import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import {
  BirthDetailsFields,
  ContactInformationFields,
  IdentificationInformationFields,
  LocationInformationFields,
  PersonalInformationFields,
} from '../../../components/ConfiguredMandatoryPatientFields';
import {
  LocalisedField,
  TextField,
  DateField,
  AutocompleteField,
  RadioField,
  FormGrid,
} from '../../../components';
import { PatientDetailsHeading } from './GenericLayout';
import { ConfiguredMandatoryPatientFields } from '../../../components/ConfiguredMandatoryPatientFields/ConfiguredMandatoryPatientFields';

export const CambodiaLocationInformationFields = ({
  showMandatory,
  subdivisionSuggester,
  divisionSuggester,
  villageSuggester,
  settlementSuggester,
}) => {
  const LOCATION_INFORMATION_FIELDS = {
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
    },
    villageId: {
      component: AutocompleteField,
      suggester: villageSuggester,
    },
    streetVillage: {
      component: TextField,
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};

export const CambodiaPrimaryDetailsLayout = ({
  values = {},
  patientRegistryType,
  villageSuggester,
  subdivisionSuggester,
  divisionSuggester,
  settlementSuggester,
  sexOptions,
  isRequiredPatientData,
}) => (
  <PatientDetailsHeading>
    <FormGrid>
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField name="firstName" component={TextField} required />
      {/* <LocalisedField
        name="middleName"
        component={TextField}
        required={isRequiredPatientData('middleName')}
      /> */}
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
      <LocationInformationFields
        villageSuggester={villageSuggester}
        subdivisionSuggester={subdivisionSuggester}
        divisionSuggester={divisionSuggester}
        settlementSuggester={settlementSuggester}
      />

      {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
        <BirthDetailsFields registeredBirthPlace={values.registeredBirthPlace} />
      )}
      <IdentificationInformationFields patientRegistryType={patientRegistryType} />
      <ContactInformationFields />
      <PersonalInformationFields patientRegistryType={patientRegistryType} />
      <LocationInformationFields />
    </FormGrid>
  </PatientDetailsHeading>
);
