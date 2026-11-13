import React from 'react';
import styled from 'styled-components';
import { isEmpty } from 'es-toolkit/compat';
import { useQuery } from '@tanstack/react-query';

import { PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';
import { Form, ButtonRow, FormSubmitButton } from '@tamanu/ui-components';

import { useApi } from '../../api';
import { getPatientDetailsValidation } from '../../validations';
import { NoteModalActionBlocker } from '../../components';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useLayoutComponents } from './useLayoutComponents';
import { usePatientFieldDefinitionQuery } from '../../api/queries/usePatientFieldDefinitionQuery';
import { usePatientInsurancePlansInUseQuery } from '../../api/queries/usePatientInsurancePlansInUseQuery';
import { useSlidingFeeScalePlanId } from '../../api/queries/useInvoiceInsurancePlansQuery';
import { useTranslation } from '../../contexts/Translation';
import { useSettings } from '../../contexts/Settings';
import { route } from '@tamanu/api-client';

const StyledPatientDetailSecondaryDetailsGroupWrapper = styled.div`
  margin-top: 70px;
`;

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

/**
 * `hideSubmitButton` and `renderExtraContent` are for a caller that owns the form's actions itself —
 * the invoicing patient details modal, whose Cancel and Save sit in the modal's fixed bottom row,
 * outside this form element.
 */
export const PatientDetailsForm = ({
  patient,
  additionalData,
  birthData,
  insurancePlans,
  onSubmit,
  hideSubmitButton = false,
  renderExtraContent = () => null,
}) => {
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
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

  const { PrimaryDetails, SecondaryDetails, PatientFields } = useLayoutComponents();

  const isRequiredPatientData = fieldName => getSetting(`fields.${fieldName}.requiredPatientData`);

  const api = useApi();
  const {
    data: fieldDefinitionsResponse,
    error: fieldDefError,
    isLoading: isLoadingFieldDefinitions,
  } = usePatientFieldDefinitionQuery();

  const {
    data: fieldValuesResponse,
    error: fieldValError,
    isLoading: isLoadingFieldValues,
  } = useQuery(
    ['patientFields', patient.id],
    () => api.get(route('patient/:patientId/fields', { patientId: patient.id })),
    {
      enabled: Boolean(patient.id),
    },
  );

  const { data: insurancePlansInUse, error: insurancePlansInUseError } =
    usePatientInsurancePlansInUseQuery({ patientId: patient.id });

  const {
    slidingFeeScalePlanId,
    isLoading: isLoadingInsurancePlans,
    error: insurancePlansError,
  } = useSlidingFeeScalePlanId();

  const errors = [
    fieldDefError,
    fieldValError,
    insurancePlansInUseError,
    insurancePlansError,
  ].filter(e => Boolean(e));
  if (errors.length > 0) {
    return <pre>{errors.map(e => e.stack).join('\n')}</pre>;
  }
  const isLoading = isLoadingFieldDefinitions || isLoadingFieldValues || isLoadingInsurancePlans;

  if (isLoading) {
    return <LoadingIndicator data-testid="loadingindicator-6mh5" />;
  }

  return (
    <Form
      render={({ values = {}, ...formProps }) => (
        <>
          <PrimaryDetails
            registeredBirthPlace={values.registeredBirthPlace}
            patientRegistryType={patientRegistryType}
            isRequiredPatientData={isRequiredPatientData}
            isDetailsForm
            data-testid="primarydetails-gyok"
          />
          <StyledPatientDetailSecondaryDetailsGroupWrapper data-testid="styledpatientdetailsecondarydetailsgroupwrapper-ox05">
            <SecondaryDetails
              registeredBirthPlace={values.registeredBirthPlace}
              patientRegistryType={patientRegistryType}
              isEdit
              data-testid="secondarydetails-2fpb"
            />
          </StyledPatientDetailSecondaryDetailsGroupWrapper>
          <PatientFields
            fieldDefinitions={fieldDefinitionsResponse.data}
            fieldValues={fieldValuesResponse?.data}
            data-testid="patientfields-csd1"
          />
          {!hideSubmitButton && (
            <ButtonRow data-testid="buttonrow-92zi">
              <NoteModalActionBlocker>
                <FormSubmitButton
                  variant="contained"
                  color="primary"
                  text="Save"
                  data-testid="formsubmitbutton-dzgy"
                />
              </NoteModalActionBlocker>
            </ButtonRow>
          )}
          {renderExtraContent(formProps)}
        </>
      )}
      initialValues={{
        ...stripPatientData(patient, additionalData, birthData),
        patientFields: addMissingFieldValues(
          fieldDefinitionsResponse.data,
          fieldValuesResponse?.data,
        ),
        invoiceInsurancePlanId: insurancePlans.map(
          ({ invoiceInsurancePlanId }) => invoiceInsurancePlanId,
        ),
      }}
      onSubmit={handleSubmit}
      validationSchema={getPatientDetailsValidation(patientRegistryType, getSetting, getTranslation, {
        insurancePlansInUse,
        slidingFeeScalePlanId,
      })}
      data-testid="form-9v1j"
    />
  );
};
