import React, { memo, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import { foreignKey, optionalForeignKey } from '../utils/validation';

import { Form, Field } from '../components/Field';
import { IdField } from '../components/Field/IdField';
import { FormGrid } from '../components/FormGrid';
import { ModalActionRow } from '../components/ButtonRow';
import { PlusIconButton, MinusIconButton } from '../components';
import { IdBanner } from '../components/IdBanner';
import { Colors, sexOptions } from '../constants';

import { PrimaryDetailsGroup, SecondaryDetailsGroup } from './PatientDetailsForm';

const sexValues = sexOptions.map(o => o.value);

const IdBannerContainer = styled.div`
  margin: -20px -32px 0 -32px;
  grid-column: 1 / -1;
`;

const AdditionalInformationRow = styled.div`
  grid-column: 1 / -1;
  border-top: 1px solid ${Colors.outline};
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

export const NewPatientForm = memo(({ editedObject, onSubmit, onCancel, generateId, isBirth }) => {
  const [isExpanded, setExpanded] = useState(false);
  const renderForm = ({ submitForm }) => (
    <FormGrid>
      <IdBannerContainer>
        <IdBanner>
          <Field name="displayId" component={IdField} regenerateId={generateId} />
        </IdBanner>
      </IdBannerContainer>
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
        <FormGrid>
          <SecondaryDetailsGroup isBirth={isBirth} />
        </FormGrid>
      </Collapse>
      <ModalActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      onSubmit={onSubmit}
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

        mother: isBirth
          ? foreignKey('Mother must be selected')
          : optionalForeignKey('Mother must be a valid patient'),
        homeClinic: isBirth && yup.string().required(),

        father: optionalForeignKey('Father must be a valid patient'),
        religion: yup.string(),
        occupation: yup.string(),
        externalId: yup.string(),
        patientType: yup.string(),
      })}
    />
  );
});
