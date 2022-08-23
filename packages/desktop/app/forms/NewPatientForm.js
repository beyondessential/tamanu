import React, { memo, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';
import { PATIENT_REGISTRY_TYPES, BIRTH_DELIVERY_TYPES, BIRTH_TYPES } from 'shared/constants';

import { useLocalisation } from '../contexts/Localisation';
import { Form, Field } from '../components/Field';
import { IdField } from '../components/Field/IdField';
import { ModalActionRow } from '../components/ModalActionRow';
import { PlusIconButton, MinusIconButton, RadioField } from '../components';
import { IdBanner } from '../components/IdBanner';
import { Colors, sexOptions, PATIENT_REGISTRY_OPTIONS } from '../constants';
import { toDateTimeString } from '../utils/dateTime';

import { PrimaryDetailsGroup, SecondaryDetailsGroup } from './PatientDetailsForm';

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
    data.patientRegistryType = patientRegistryType;
    (data.timeOfBirth = toDateTimeString(data.timeOfBirth)), onSubmit(data);
  };

  const renderForm = ({ submitForm }) => {
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
        ></StyledRadioField>
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
          <SecondaryDetailsGroup patientRegistryType={patientRegistryType} />
        </Collapse>
        <ModalActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
      </>
    );
  };

  const { getLocalisation } = useLocalisation();
  let sexValues = sexOptions.map(o => o.value);
  if (getLocalisation('features.hideOtherSex') === true) {
    sexValues = sexValues.filter(s => s !== 'other');
  }

  return (
    <Form
      onSubmit={handleSubmit}
      render={renderForm}
      initialValues={{
        displayId: generateId(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        firstName: yup.string().required(),
        middleName: yup.string(),
        lastName: yup.string().required(),
        culturalName: yup.string(),
        dateOfBirth: yup.date().required(),
        sex: yup
          .string()
          .oneOf(sexValues)
          .required(),
        email: yup.string().email(),
        religion: yup.string(),
        occupation: yup.string(),
        birthWeight: yup
          .number()
          .min(0)
          .max(6),
        birthLength: yup
          .number()
          .min(0)
          .max(50),
        birthDeliveryType: yup.string().oneOf(Object.values(BIRTH_DELIVERY_TYPES)),
        gestationalAgeEstimate: yup
          .number()
          .min(1)
          .max(45),
        apgarScoreOneMinute: yup
          .number()
          .min(1)
          .max(10),
        apgarScoreFiveMinutes: yup
          .number()
          .min(1)
          .max(10),
        apgarScoreTenMinutes: yup
          .number()
          .min(1)
          .max(10),
        birthType: yup.string().oneOf(Object.values(BIRTH_TYPES)),
        timeOfBirth: yup.string(),
      })}
    />
  );
});
