import React, { Fragment } from 'react';
import styled from 'styled-components';
import { isEmpty, groupBy } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';

import { useSexValues } from '../hooks';
import { Colors, sexOptions } from '../constants';
import { useLocalisation } from '../contexts/Localisation';
import { useApi, useSuggester } from '../api';
import { getPatientDetailsValidation } from '../validations';
import {
  AutocompleteField,
  Button,
  ButtonRow,
  DateField,
  Field,
  Form,
  FormGrid,
  LocalisedField,
  NumberField,
  RadioField,
  SelectField,
  TextField,
} from '../components';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  BirthDetailsFields,
  IdentificationInformationFields,
  ContactInformationFields,
  PersonalInformationFields,
  LocationInformationFields,
} from '../components/ConfiguredMandatoryPatientFields';

const StyledHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
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

export const PrimaryDetailsGroup = ({ values = {}, patientRegistryType }) => {
  const villageSuggester = useSuggester('village');
  const { getLocalisation } = useLocalisation();
  let filteredSexOptions = sexOptions;
  if (getLocalisation('features.hideOtherSex') === true) {
    filteredSexOptions = filteredSexOptions.filter(s => s.value !== 'other');
  }

  const isRequiredPatientData = fieldName =>
    getLocalisation(`fields.${fieldName}.requiredPatientData`);

  return (
    <>
      <StyledHeading>General information</StyledHeading>
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
          max={getCurrentDateString()}
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
        <LocalisedField name="sex" component={RadioField} options={filteredSexOptions} required />
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
};

export const SecondaryDetailsGroup = ({ values = {}, patientRegistryType, isEdit = false }) => {
  return (
    <StyledSecondaryDetailsGroup>
      {patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY && (
        <>
          <StyledHeading>Birth details</StyledHeading>
          <StyledFormGrid>
            <BirthDetailsFields
              registeredBirthPlace={values.registeredBirthPlace}
              showMandatory={false}
            />
          </StyledFormGrid>
        </>
      )}

      <StyledHeading>Identification information</StyledHeading>
      <StyledFormGrid>
        <IdentificationInformationFields
          isEdit={isEdit}
          patientRegistryType={patientRegistryType}
          showMandatory={false}
        />
      </StyledFormGrid>

      <StyledHeading>Contact information</StyledHeading>
      <StyledFormGrid>
        <ContactInformationFields showMandatory={false} />
      </StyledFormGrid>

      <StyledHeading>Personal information</StyledHeading>
      <StyledFormGrid>
        <PersonalInformationFields
          patientRegistryType={patientRegistryType}
          showMandatory={false}
        />
      </StyledFormGrid>

      <StyledHeading>Location information</StyledHeading>
      <StyledFormGrid>
        <LocationInformationFields showMandatory={false} />
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

  const { getLocalisation } = useLocalisation();

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
          <PrimaryDetailsGroup values={values} patientRegistryType={patientRegistryType} />
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
      validationSchema={getPatientDetailsValidation(
        patientRegistryType,
        sexValues,
        getLocalisation,
      )}
    />
  );
};
