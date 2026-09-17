import Collapse from '@material-ui/core/Collapse';
import IconButton from '@mui/material/IconButton';
import { CircleMinus, CirclePlus } from 'lucide-react';
import React, { memo, useState } from 'react';
import styled from 'styled-components';

import { FORM_TYPES, PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES } from '@tamanu/constants';
import {
  Field,
  Form,
  TranslatedText,
  useSettings,
  useTranslation,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { usePatientFieldDefinitionQuery } from '../api/queries/usePatientFieldDefinitionQuery';
import { RadioField } from '../components';
import { IdField } from '../components/Field/IdField';
import { IdBanner } from '../components/IdBanner';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { Colors } from '../constants/styles';
import { getPatientDetailsValidation } from '../validations';
import { RandomPatientButton } from '../views/patients/components/RandomPatientButton';
import { useLayoutComponents } from './PatientDetailsForm';

const StyledIconButton = styled(IconButton)`
  margin-inline-end: 5px;
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
                />
              ),
            },
            {
              value: PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
              label: (
                <TranslatedText
                  stringId="patient.newPatientAction.option.birthRegistry"
                  fallback="Register birth"
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
                <StyledIconButton
                  onClick={() => setExpanded(false)}
                  data-testid="styledimagebutton-yauj"
                >
                  <CircleMinus />
                  <VisuallyHidden>
                    <TranslatedText stringId="general.action.collapse" fallback="Collapse" />
                  </VisuallyHidden>
                </StyledIconButton>
              ) : (
                <StyledIconButton
                  onClick={() => setExpanded(true)}
                  data-testid="styledimagebutton-8ihm"
                >
                  <CirclePlus />
                  <VisuallyHidden>
                    <TranslatedText stringId="general.action.expand" fallback="Expand" />
                  </VisuallyHidden>
                </StyledIconButton>
              )}
              <TranslatedText
                stringId="patient.additionalInformation.label"
                fallback="Add additional information"
              />
              <span>
                {' '}
                <TranslatedText
                  stringId="patient.additionalInformation.exampleText"
                  fallback="(religion, occupation, blood type…)"
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
        )}
        data-testid="form-60mo"
      />
    );
  },
);
