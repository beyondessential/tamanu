import React, { memo, useState } from 'react';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';
import { useQuery } from '@tanstack/react-query';

import { PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';

import { useLocalisation } from '../contexts/Localisation';

import { Field, Form } from '../components/Field';
import { IdField } from '../components/Field/IdField';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { RadioField } from '../components';
import { IdBanner } from '../components/IdBanner';
import { Colors, FORM_TYPES } from '../constants';
import { getPatientDetailsValidation } from '../validations';
import {
  PatientFieldsGroup,
  PrimaryDetailsGroup,
  SecondaryDetailsGroup,
} from './PatientDetailsForm';
import { useSexValues } from '../hooks';
import { useApi } from '../api';
import { LoadingIndicator } from '../components/LoadingIndicator';

import plusCircle from '../assets/images/plus_circle.svg';
import minusCircle from '../assets/images/minus_circle.svg';
import { RandomPatientButton } from '../views/patients/components/RandomPatientButton';
import { TranslatedText } from '../components/Translation/TranslatedText';

const StyledImageButton = styled(Button)`
  min-width: 30px;
  margin-right: 5px;
  background: ${Colors.background};
`;

const IdBannerContainer = styled.div`
  margin: -20px -32px 0 -32px;
  grid-column: 1 / -1;
`;

const AdditionalInformationRow = styled.div`
  grid-column: 1 / -1;
  border-top: 1px solid ${Colors.outline};
  margin-top: 30px;
  margin-bottom: 20px;
  padding: 10px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  div {
    font-weight: 500;
    font-size: 17px;
    color: ${Colors.darkestText};
  }

  button {
    padding: 0;
    color: ${Colors.primary};
  }

  div span {
    font-weight: 200;
    font-size: 14px;
    color: #999999;
  }
`;

const StyledRadioField = styled(RadioField)`
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const NewPatientForm = memo(({ editedObject, onSubmit, onCancel, generateId }) => {
  const [isExpanded, setExpanded] = useState(false);
  const [patientRegistryType, setPatientRegistryType] = useState(
    PATIENT_REGISTRY_TYPES.NEW_PATIENT,
  );
  const api = useApi();
  const { data: fieldDefinitions, error, isLoading } = useQuery(['patientFieldDefinition'], () =>
    api.get(`patientFieldDefinition`),
  );
  const sexValues = useSexValues();

  const { getLocalisation } = useLocalisation();

  if (error) {
    return <pre>{error.stack}</pre>;
  }

  const handleSubmit = async data => {
    const newData = { ...data };
    newData.patientRegistryType = patientRegistryType;

    if (newData.registeredBirthPlace !== PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY) {
      newData.birthFacilityId = null;
    }

    await onSubmit(newData);
  };

  const renderForm = ({ submitForm, values, setValues }) => {
    return (
      <>
        <IdBannerContainer>
          <RandomPatientButton setValues={setValues} generateId={generateId} />
          <IdBanner>
            <Field name="displayId" component={IdField} regenerateId={generateId} />
          </IdBanner>
        </IdBannerContainer>
        <StyledRadioField
          field={{
            name: 'newPatient',
            label: 'New patient action',
            value: patientRegistryType,
            onChange: event => setPatientRegistryType(event.target?.value),
          }}
          options={[
            {
              value: PATIENT_REGISTRY_TYPES.NEW_PATIENT,
              label: (
                <TranslatedText
                  stringId="patient.form.newPatientAction.option.newPatient"
                  fallback="Create new patient"
                />
              ),
            },
            {
              value: PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
              label: (
                <TranslatedText
                  stringId="patient.form.newPatientAction.option.birthRegistry"
                  fallback="Register birth"
                />
              ),
            },
          ]}
          style={{ gridColumn: '1 / -1' }}
        />
        <PrimaryDetailsGroup values={values} patientRegistryType={patientRegistryType} />
        <AdditionalInformationRow>
          <div>
            {isExpanded ? (
              <StyledImageButton onClick={() => setExpanded(false)}>
                <img alt="Minus button" src={minusCircle} />
              </StyledImageButton>
            ) : (
              <StyledImageButton onClick={() => setExpanded(true)}>
                <img alt="Plus button" src={plusCircle} />
              </StyledImageButton>
            )}
            <TranslatedText
              stringId="patient.form.additionalInformation.label"
              fallback="Add additional information"
            />
            <span>
              {' '}
              <TranslatedText
                stringId="patient.form.additionalInformation.exampleText"
                fallback="(religion, occupation, blood type...)"
              />
            </span>
          </div>
        </AdditionalInformationRow>
        <Collapse in={isExpanded} style={{ gridColumn: 'span 2' }}>
          <SecondaryDetailsGroup patientRegistryType={patientRegistryType} values={values} />
          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <PatientFieldsGroup fieldDefinitions={fieldDefinitions?.data} />
          )}
        </Collapse>
        <ModalFormActionRow
          confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
          onConfirm={submitForm}
          onCancel={onCancel}
        />
      </>
    );
  };

  return (
    <Form
      onSubmit={handleSubmit}
      render={renderForm}
      formType={FORM_TYPES.CREATE_FORM}
      initialValues={{
        displayId: generateId(),
        ...editedObject,
      }}
      validationSchema={getPatientDetailsValidation(
        patientRegistryType,
        sexValues,
        getLocalisation,
      )}
    />
  );
});
