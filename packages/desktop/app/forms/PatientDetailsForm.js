import React, { Fragment } from 'react';
import styled from 'styled-components';
import { isEmpty, groupBy } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';

import { useSexValues } from '../hooks';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  Colors,
  PLACE_OF_BIRTH_OPTIONS,
  bloodOptions,
  educationalAttainmentOptions,
  maritalStatusOptions,
  sexOptions,
  socialMediaOptions,
  titleOptions,
} from '../constants';
import { useLocalisation } from '../contexts/Localisation';
import { useApi, useSuggester, usePatientSuggester } from '../api';
import { getPatientDetailsValidation } from '../validations';
import {
  AutocompleteField,
  Button,
  ButtonRow,
  DateField,
  DisplayIdField,
  Field,
  Form,
  FormGrid,
  LocalisedField,
  NumberField,
  RadioField,
  SelectField,
  SuggesterSelectField,
  TextField,
  TimeField,
} from '../components';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { TranslatedText } from '../components/Translation/TranslatedText';

const StyledHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 10px;
`;

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;

const StyledSecondaryDetailsGroup = styled.div`
  margin-top: 20px;
`;

const StyledPatientDetailSecondaryDetailsGroupWrapper = styled.div`
  margin-top: 70px;
`;

export const PrimaryDetailsGroup = () => {
  const villageSuggester = useSuggester('village');
  const { getLocalisation } = useLocalisation();
  let filteredSexOptions = sexOptions;
  if (getLocalisation('features.hideOtherSex') === true) {
    filteredSexOptions = filteredSexOptions.filter(s => s.value !== 'other');
  }

  return (
    <FormGrid>
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField name="middleName" component={TextField} />
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField name="culturalName" component={TextField} />
      <LocalisedField
        name="dateOfBirth"
        max={getCurrentDateString()}
        component={DateField}
        required
        saveDateAsString
      />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <LocalisedField name="sex" component={RadioField} options={filteredSexOptions} required />
      <LocalisedField
        name="email"
        component={TextField}
        type="email"
        defaultLabel={<TranslatedText stringId="general.form.email" fallback="Email Address" />}
      />
    </FormGrid>
  );
};

export const SecondaryDetailsGroup = ({ patientRegistryType, values = {}, isEdit = false }) => {
  const { getLocalisation } = useLocalisation();
  const canEditDisplayId = isEdit && getLocalisation('features.editPatientDisplayId');
  const countrySuggester = useSuggester('country');
  const divisionSuggester = useSuggester('division');
  const ethnicitySuggester = useSuggester('ethnicity');
  const medicalAreaSuggester = useSuggester('medicalArea');
  const nationalitySuggester = useSuggester('nationality');
  const nursingZoneSuggester = useSuggester('nursingZone');
  const occupationSuggester = useSuggester('occupation');
  const settlementSuggester = useSuggester('settlement');
  const subdivisionSuggester = useSuggester('subdivision');
  const religionSuggester = useSuggester('religion');
  const facilitySuggester = useSuggester('facility');
  const patientSuggester = usePatientSuggester();

  return (
    <StyledSecondaryDetailsGroup>
      {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
        <>
          <StyledHeading>
            <TranslatedText
              stringId="patient.details.subheading.birthDetails"
              fallback="Birth details"
            />
          </StyledHeading>
          <StyledFormGrid>
            <LocalisedField name="timeOfBirth" component={TimeField} saveDateAsString />
            <LocalisedField name="gestationalAgeEstimate" component={TextField} type="number" />
            <LocalisedField
              name="registeredBirthPlace"
              component={SelectField}
              options={PLACE_OF_BIRTH_OPTIONS}
            />
            {values.registeredBirthPlace === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY && (
              <LocalisedField
                name="birthFacilityId"
                component={AutocompleteField}
                suggester={facilitySuggester}
              />
            )}
            <LocalisedField
              name="attendantAtBirth"
              component={SelectField}
              options={ATTENDANT_OF_BIRTH_OPTIONS}
            />
            <LocalisedField name="nameOfAttendantAtBirth" component={TextField} type="text" />
            <LocalisedField
              name="birthDeliveryType"
              component={SelectField}
              options={BIRTH_DELIVERY_TYPE_OPTIONS}
            />
            <LocalisedField name="birthType" component={SelectField} options={BIRTH_TYPE_OPTIONS} />
            <LocalisedField name="birthWeight" component={TextField} type="number" />
            <LocalisedField name="birthLength" component={TextField} type="number" />
            <LocalisedField name="apgarScoreOneMinute" component={TextField} type="number" />
            <LocalisedField name="apgarScoreFiveMinutes" component={TextField} type="number" />
            <LocalisedField name="apgarScoreTenMinutes" component={TextField} type="number" />
          </StyledFormGrid>
        </>
      )}

      <StyledHeading>
        <TranslatedText
          stringId="patient.details.subheading.identificationInformation"
          fallback="Identification information"
        />
      </StyledHeading>
      <StyledFormGrid>
        {canEditDisplayId && <DisplayIdField />}
        <LocalisedField name="birthCertificate" component={TextField} />
        {patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT && (
          <LocalisedField name="drivingLicense" component={TextField} />
        )}
        <LocalisedField name="passport" component={TextField} />
      </StyledFormGrid>

      <StyledHeading>
        <TranslatedText
          stringId="patient.details.subheading.contactInformation"
          fallback="Contact information"
        />
      </StyledHeading>
      <StyledFormGrid>
        <LocalisedField name="primaryContactNumber" component={TextField} type="tel" />
        <LocalisedField name="secondaryContactNumber" component={TextField} type="tel" />
        <LocalisedField name="emergencyContactName" component={TextField} />
        <LocalisedField name="emergencyContactNumber" component={TextField} type="tel" />
      </StyledFormGrid>

      <StyledHeading>
        <TranslatedText
          stringId="patient.details.subheading.personalInformation"
          fallback="Personal information"
        />
      </StyledHeading>
      <StyledFormGrid>
        <LocalisedField name="title" component={SelectField} options={titleOptions} />
        {patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT && (
          <LocalisedField
            name="maritalStatus"
            component={SelectField}
            options={maritalStatusOptions}
          />
        )}
        <LocalisedField name="bloodType" component={SelectField} options={bloodOptions} />
        <LocalisedField name="placeOfBirth" component={TextField} />
        <LocalisedField
          name="countryOfBirthId"
          component={AutocompleteField}
          suggester={countrySuggester}
        />
        <LocalisedField
          name="nationalityId"
          component={AutocompleteField}
          suggester={nationalitySuggester}
        />
        <LocalisedField
          name="ethnicityId"
          component={AutocompleteField}
          suggester={ethnicitySuggester}
        />
        <LocalisedField
          name="religionId"
          component={AutocompleteField}
          suggester={religionSuggester}
        />
        {patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT && (
          <>
            <LocalisedField
              name="educationalLevel"
              component={SelectField}
              options={educationalAttainmentOptions}
            />
            <LocalisedField
              name="occupationId"
              component={AutocompleteField}
              suggester={occupationSuggester}
            />
            <LocalisedField
              name="socialMedia"
              component={SelectField}
              options={socialMediaOptions}
            />
          </>
        )}
        <LocalisedField
          name="patientBillingTypeId"
          endpoint="patientBillingType"
          component={SuggesterSelectField}
        />
        <LocalisedField
          name="motherId"
          component={AutocompleteField}
          suggester={patientSuggester}
        />
        <LocalisedField
          name="fatherId"
          component={AutocompleteField}
          suggester={patientSuggester}
        />
      </StyledFormGrid>

      <StyledHeading>
        <TranslatedText
          stringId="patient.details.subheading.locationInformation"
          fallback="Location information"
        />
      </StyledHeading>
      <StyledFormGrid>
        <LocalisedField name="cityTown" component={TextField} />
        <LocalisedField
          name="subdivisionId"
          component={AutocompleteField}
          suggester={subdivisionSuggester}
        />
        <LocalisedField
          name="divisionId"
          component={AutocompleteField}
          suggester={divisionSuggester}
        />
        <LocalisedField
          name="countryId"
          component={AutocompleteField}
          suggester={countrySuggester}
        />

        <LocalisedField
          name="settlementId"
          component={AutocompleteField}
          suggester={settlementSuggester}
        />
        <LocalisedField
          name="medicalAreaId"
          component={AutocompleteField}
          suggester={medicalAreaSuggester}
        />
        <LocalisedField
          name="nursingZoneId"
          component={AutocompleteField}
          suggester={nursingZoneSuggester}
        />
        <LocalisedField name="streetVillage" component={TextField} />
      </StyledFormGrid>
    </StyledSecondaryDetailsGroup>
  );
};

const PatientField = ({ definition: { definitionId, name, fieldType, options } }) => {
  // TODO: temporary placeholder component
  // the plan is to reuse the survey question components for these fields
  const fieldName = `patientFields.${definitionId}`;
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.SELECT) {
    const fieldOptions = options.map(o => ({ label: o, value: o }));
    return <Field name={fieldName} component={SelectField} label={name} options={fieldOptions} />;
  }
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.STRING) {
    return <Field name={fieldName} component={TextField} label={name} />;
  }
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.NUMBER) {
    return <Field name={fieldName} component={NumberField} label={name} />;
  }
  return <p>Unknown field type: {fieldType}</p>;
};

export const PatientFieldsGroup = ({ fieldDefinitions, fieldValues }) => {
  const groupedFieldDefs = Object.entries(groupBy(fieldDefinitions, 'category'));
  return (
    <div>
      {groupedFieldDefs.map(([category, defs]) => (
        <Fragment key={category}>
          <StyledHeading>{category}</StyledHeading>
          <StyledFormGrid>
            {defs.map(f => (
              <PatientField
                key={f.definitionId}
                definition={f}
                value={fieldValues ? fieldValues[f.definitionId] : ''}
              />
            ))}
          </StyledFormGrid>
        </Fragment>
      ))}
    </div>
  );
};

function sanitiseRecordForValues(data) {
  const {
    // unwanted ids
    id,
    patientId,

    // backend fields
    markedForSync,
    createdAt,
    updatedAt,
    updatedAtSyncTick,

    // state fields
    loading,
    error,

    ...remaining
  } = data;

  return Object.entries(remaining)
    .filter(([, v]) => {
      if (Array.isArray(v)) return false;
      if (typeof v === 'object') return false;
      return true;
    })
    .reduce((state, [k, v]) => ({ ...state, [k]: v }), {});
}

function addMissingFieldValues(definitions, knownValues) {
  const exhaustiveValues = {};
  for (const { definitionId } of definitions) {
    const value = knownValues ? knownValues[definitionId] : '';
    exhaustiveValues[definitionId] = value || '';
  }
  return exhaustiveValues;
}

function stripPatientData(patient, additionalData, birthData) {
  // The patient object includes the entirety of patient state, not just the
  // fields on the db record, and whatever we pass to initialValues will get
  // sent on to the server if it isn't modified by a field on the form.
  // So, we strip that out here.

  return {
    ...sanitiseRecordForValues(patient),
    ...sanitiseRecordForValues(additionalData),
    ...sanitiseRecordForValues(birthData),
  };
}

export const PatientDetailsForm = ({ patient, additionalData, birthData, onSubmit }) => {
  const patientRegistryType = !isEmpty(birthData)
    ? PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY
    : PATIENT_REGISTRY_TYPES.NEW_PATIENT;

  const handleSubmit = data => {
    const newData = { ...data };

    if (newData.registeredBirthPlace !== PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY) {
      newData.birthFacilityId = null;
    }

    onSubmit(newData);
  };

  const sexValues = useSexValues();

  const api = useApi();
  const {
    data: fieldDefinitionsResponse,
    error: fieldDefError,
    isLoading: isLoadingFieldDefinitions,
  } = useQuery(['patientFieldDefinition'], () => api.get(`patientFieldDefinition`));
  const {
    data: fieldValuesResponse,
    error: fieldValError,
    isLoading: isLoadingFieldValues,
  } = useQuery(['patientFields', patient.id], () => api.get(`patient/${patient.id}/fields`), {
    enabled: Boolean(patient.id),
  });
  const errors = [fieldDefError, fieldValError].filter(e => Boolean(e));
  if (errors.length > 0) {
    return <pre>{errors.map(e => e.stack).join('\n')}</pre>;
  }
  const isLoading = isLoadingFieldDefinitions || isLoadingFieldValues;
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <Form
      render={({ submitForm, values }) => (
        <>
          <PrimaryDetailsGroup />
          <StyledPatientDetailSecondaryDetailsGroupWrapper>
            <SecondaryDetailsGroup
              patientRegistryType={patientRegistryType}
              values={values}
              isEdit
            />
          </StyledPatientDetailSecondaryDetailsGroupWrapper>
          <PatientFieldsGroup
            fieldDefinitions={fieldDefinitionsResponse.data}
            fieldValues={fieldValuesResponse?.data}
          />
          <ButtonRow>
            <Button variant="contained" color="primary" onClick={submitForm}>
              Save
            </Button>
          </ButtonRow>
        </>
      )}
      initialValues={{
        ...stripPatientData(patient, additionalData, birthData),
        patientFields: addMissingFieldValues(
          fieldDefinitionsResponse.data,
          fieldValuesResponse?.data,
        ),
      }}
      onSubmit={handleSubmit}
      validationSchema={getPatientDetailsValidation(sexValues)}
    />
  );
};
