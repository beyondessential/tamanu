import React, { Fragment, useMemo } from 'react';
import styled from 'styled-components';
import { groupBy, isEmpty } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import {
  PATIENT_REGISTRY_TYPES,
  PLACE_OF_BIRTH_TYPES,
  SEX_OPTIONS,
  PATIENT_FIELD_DEFINITION_TYPES,
  PATIENT_DETAIL_LAYOUTS,
} from '@tamanu/constants';

import { useSexValues } from '../../hooks';
import { Colors } from '../../constants';
import { useLocalisation } from '../../contexts/Localisation';
import { useApi } from '../../api';
import { getPatientDetailsValidation } from '../../validations';
import {
  ButtonRow,
  Field,
  Form,
  FormGrid,
  FormSubmitButton,
  NumberField,
  SelectField,
  TextField,
} from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';

import {
  CambodiaPatientFieldLayout,
  CambodiaPrimaryDetailsLayout,
  CambodiaSecondaryDetailsLayout,
} from './layouts/cambodia/CambodiaLayout';
import {
  GenericPatientFieldLayout,
  GenericPrimaryDetailsLayout,
  GenericSecondaryDetailsLayout,
} from './layouts/generic/GenericLayout';

const LAYOUT_COMPONENTS = {
  [PATIENT_DETAIL_LAYOUTS.GENERIC]: {
    PrimaryDetails: GenericPrimaryDetailsLayout,
    SecondaryDetails: GenericSecondaryDetailsLayout,
    PatientFields: GenericPatientFieldLayout,
  },
  [PATIENT_DETAIL_LAYOUTS.CAMBODIA]: {
    PrimaryDetails: CambodiaPrimaryDetailsLayout,
    SecondaryDetails: CambodiaSecondaryDetailsLayout,
    PatientFields: CambodiaPatientFieldLayout,
  },
};

const StyledHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
`;

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;

const StyledPatientDetailSecondaryDetailsGroupWrapper = styled.div`
  margin-top: 70px;
`;

export const PatientField = ({ definition: { definitionId, name, fieldType, options } }) => {
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
  const values = { ...data };

  // unwanted ids
  delete values.id;
  delete values.patientId;

  // backend fields
  delete values.markedForSync;
  delete values.createdAt;
  delete values.updatedAt;
  delete values.updatedAtSyncTick;

  // state fields
  delete values.loading;
  delete values.error;

  return Object.entries(values)
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

  const handleSubmit = async data => {
    const newData = { ...data };

    if (newData.registeredBirthPlace !== PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY) {
      newData.birthFacilityId = null;
    }

    await onSubmit(newData);
  };

  const sexValues = useSexValues();

  const { getLocalisation } = useLocalisation();

  const layout = getLocalisation('patientDetails.layout');
  const { PrimaryDetails, SecondaryDetails, PatientFields } = useMemo(
    () => LAYOUT_COMPONENTS[layout || PATIENT_DETAIL_LAYOUTS.GENERIC],
    [layout],
  );

  let filteredSexOptions = SEX_OPTIONS;
  if (getLocalisation('features.hideOtherSex') === true) {
    filteredSexOptions = filteredSexOptions.filter(s => s.value !== 'other');
  }

  const isRequiredPatientData = fieldName =>
    getLocalisation(`fields.${fieldName}.requiredPatientData`);

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
      render={({ values = {} }) => (
        <>
          <PrimaryDetails
            registeredBirthPlace={values.registeredBirthPlace}
            patientRegistryType={patientRegistryType}
            isRequiredPatientData={isRequiredPatientData}
            sexOptions={filteredSexOptions}
          />
          <StyledPatientDetailSecondaryDetailsGroupWrapper>
            <SecondaryDetails
              registeredBirthPlace={values.registeredBirthPlace}
              patientRegistryType={patientRegistryType}
              isEdit
            />
          </StyledPatientDetailSecondaryDetailsGroupWrapper>
          <PatientFields
            fieldDefinitions={fieldDefinitionsResponse.data}
            fieldValues={fieldValuesResponse?.data}
          />
          <ButtonRow>
            <FormSubmitButton variant="contained" color="primary" text="Save" />
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
