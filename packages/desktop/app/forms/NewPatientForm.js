import React, { memo, useState } from 'react';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import { PATIENT_REGISTRY_TYPES, PLACE_OF_BIRTH_TYPES } from 'shared/constants';

import { Form, Field } from '../components/Field';
import { IdField } from '../components/Field/IdField';
import { ModalActionRow } from '../components/ModalActionRow';
import { PlusIconButton, MinusIconButton, RadioField } from '../components';
import { IdBanner } from '../components/IdBanner';
import { Colors, PATIENT_REGISTRY_OPTIONS } from '../constants';
import { toDateTimeString } from '../utils/dateTime';
import { getPatientDetailsValidation } from '../validations';
import { PrimaryDetailsGroup, SecondaryDetailsGroup } from './PatientDetailsForm';
import { useSexValues } from '../hooks';

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

  const handleSubmit = data => {
    const newData = { ...data };
    newData.patientRegistryType = patientRegistryType;
    newData.timeOfBirth =
      typeof data.timeOfBirth !== 'string'
        ? toDateTimeString(newData.timeOfBirth)
        : newData.timeOfBirth;

    if (newData.registeredBirthPlace !== PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY) {
      newData.birthFacilityId = null;
    }

    onSubmit(newData);
  };

  const renderForm = ({ submitForm, values }) => {
    return (
      <>
        <IdBannerContainer>
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
          options={PATIENT_REGISTRY_OPTIONS}
          style={{ gridColumn: '1 / -1' }}
        />
        <PrimaryDetailsGroup />
        <AdditionalInformationRow>
          <div>
            Add additional information
            <span> (religion, occupation, blood type...)</span>
          </div>
          {isExpanded ? (
            <MinusIconButton onClick={() => setExpanded(false)} />
          ) : (
            <PlusIconButton onClick={() => setExpanded(true)} />
          )}
        </AdditionalInformationRow>
        <Collapse in={isExpanded} style={{ gridColumn: 'span 2' }}>
          <SecondaryDetailsGroup patientRegistryType={patientRegistryType} values={values} />
        </Collapse>
        <ModalActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
      </>
    );
  };

  const sexValues = useSexValues();

  return (
    <Form
      onSubmit={handleSubmit}
      render={renderForm}
      initialValues={{
        displayId: generateId(),
        ...editedObject,
      }}
      validationSchema={getPatientDetailsValidation(sexValues)}
    />
  );
});
