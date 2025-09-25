import React, { memo, useState } from 'react';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';

import { PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES, FORM_TYPES } from '@tamanu/constants';
import { Form } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';

import { Field } from '../components/Field';
import { IdField } from '../components/Field/IdField';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { RadioField } from '../components';
import { IdBanner } from '../components/IdBanner';
import { getPatientDetailsValidation } from '../validations';

import { LoadingIndicator } from '../components/LoadingIndicator';

import plusCircle from '../assets/images/plus_circle.svg';
import minusCircle from '../assets/images/minus_circle.svg';
import { RandomPatientButton } from '../views/patients/components/RandomPatientButton';
import { useLayoutComponents } from './PatientDetailsForm';
import { usePatientFieldDefinitionQuery } from '../api/queries/usePatientFieldDefinitionQuery';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { useSettings } from '../contexts/Settings';

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

export const NewPatientForm = memo(
  ({ collapseAdditionalFields, onSubmit, onCancel, generateId }) => {
    const [isExpanded, setExpanded] = useState(false);
    const [patientRegistryType, setPatientRegistryType] = useState(
      PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    );
    const { data: fieldDefinitions, error, isLoading } = usePatientFieldDefinitionQuery();

    const { getSetting } = useSettings();
    const { getTranslation } = useTranslation();
    const { PrimaryDetails, SecondaryDetails, PatientFields } = useLayoutComponents();

    const isRequiredPatientData = fieldName =>
      getSetting(`fields.${fieldName}.requiredPatientData`);

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

    const renderForm = ({ submitForm, values, setValues }) => (
      <>
        <IdBannerContainer data-testid="idbannercontainer-0ghp">
          <RandomPatientButton
            setValues={setValues}
            generateId={generateId}
            data-testid="randompatientbutton-q71o"
          />
          <IdBanner data-testid="idbanner-x5bf">
            <Field
              name="displayId"
              component={IdField}
              regenerateId={generateId}
              data-testid="field-u69a"
            />
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
                  stringId="patient.newPatientAction.option.newPatient"
                  fallback="Add new patient"
                  data-testid="translatedtext-kswe"
                />
              ),
            },
            {
              value: PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
              label: (
                <TranslatedText
                  stringId="patient.newPatientAction.option.birthRegistry"
                  fallback="Register birth"
                  data-testid="translatedtext-h9jt"
                />
              ),
            },
          ]}
          style={{ gridColumn: '1 / -1' }}
          data-testid="styledradiofield-rxta"
        />
        <PrimaryDetails
          registeredBirthPlace={values.registeredBirthPlace}
          isRequiredPatientData={isRequiredPatientData}
          values={values}
          patientRegistryType={patientRegistryType}
          data-testid="primarydetails-kiso"
        />
        <AdditionalInformationRow data-testid="additionalinformationrow-ab5o">
          {collapseAdditionalFields && (
            <div>
              {isExpanded ? (
                <StyledImageButton
                  onClick={() => setExpanded(false)}
                  data-testid="styledimagebutton-yauj"
                >
                  <img alt="Minus button" src={minusCircle} />
                </StyledImageButton>
              ) : (
                <StyledImageButton
                  onClick={() => setExpanded(true)}
                  data-testid="styledimagebutton-8ihm"
                >
                  <img alt="Plus button" src={plusCircle} />
                </StyledImageButton>
              )}
              <TranslatedText
                stringId="patient.additionalInformation.label"
                fallback="Add additional information"
                data-testid="translatedtext-svf7"
              />
              <span>
                {' '}
                <TranslatedText
                  stringId="patient.additionalInformation.exampleText"
                  fallback="(religion, occupation, blood type...)"
                  data-testid="translatedtext-nfg6"
                />
              </span>
            </div>
          )}
        </AdditionalInformationRow>
        <Collapse
          in={!collapseAdditionalFields || isExpanded}
          style={{ gridColumn: 'span 2' }}
          data-testid="collapse-pfyt"
        >
          <SecondaryDetails
            patientRegistryType={patientRegistryType}
            registeredBirthPlace={values.registeredBirthPlace}
            data-testid="secondarydetails-heuw"
          />
          {isLoading ? (
            <LoadingIndicator data-testid="loadingindicator-joxa" />
          ) : (
            <PatientFields
              fieldDefinitions={fieldDefinitions?.data}
              data-testid="patientfields-6e9u"
            />
          )}
        </Collapse>
        <ModalFormActionRow
          confirmText={
            <TranslatedText
              stringId="patient.register.action.createNewPatient"
              fallback="Create new patient"
              data-testid="translatedtext-add-new-patient"
            />
          }
          onConfirm={submitForm}
          onCancel={onCancel}
          data-testid="modalformactionrow-h4kx"
        />
      </>
    );

    return (
      <Form
        onSubmit={handleSubmit}
        render={renderForm}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{
          displayId: generateId(),
        }}
        validationSchema={getPatientDetailsValidation(
          patientRegistryType,
          getSetting,
          getTranslation,
          getSetting,
        )}
        data-testid="form-60mo"
      />
    );
  },
);
