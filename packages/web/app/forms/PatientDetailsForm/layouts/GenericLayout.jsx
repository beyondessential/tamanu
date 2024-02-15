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
import { ConfiguredMandatoryPatientFields } from '../../../components/ConfiguredMandatoryPatientFields/ConfiguredMandatoryPatientFields';
import styled from 'styled-components';
import { Colors } from '../../../constants';

export const PatientDetailsHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
`;



export const GenericLocationInformationFields = ({
  showMandatory,
  subdivisionSuggester,
  divisionSuggester,
  countrySuggester,
  settlementSuggester,
  medicalAreaSuggester,
  nursingZoneSuggester,
}) => {

  const LOCATION_INFORMATION_FIELDS = {
    cityTown: {
      component: TextField,
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
    },
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
    },
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
    },
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
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

export const GenericPrimaryDetailsLayout = ({
  values = {},
  patientRegistryType,
  villageSuggester,
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
      <BirthDetailsFields registeredBirthPlace={values.registeredBirthPlace} />
    )}
    <IdentificationInformationFields patientRegistryType={patientRegistryType} />
    <ContactInformationFields />
    <PersonalInformationFields patientRegistryType={patientRegistryType} />
    <LocationInformationFields />
    </FormGrid>
  </>
);
