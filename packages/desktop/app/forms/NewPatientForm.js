import React, { memo, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import {
  Form,
  Field,
  DateField,
  AutocompleteField,
  TextField,
  RadioField,
  IdField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { PlusIconButton, MinusIconButton } from '../components';

const ActionRow = styled(ConfirmCancelRow)`
  grid-column: span 2;
  margin: 0 -32px;
  border-top: 1px solid #dedede;
  padding: 18px 32px 0 0;
`;

const IdBanner = styled.div`
  margin: -20px -32px 0 -32px;
  grid-column: span 2;
`;

const AdditionalInformationRow = styled.div`
  grid-column: span 2;
  border-top: 1px solid #dedede;
  padding: 10px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  div {
    font-weight: 500;
    font-size: 17px;
    color: #444444;
  }

  button {
    padding: 0;
    color: #4285f4;
  }

  div span {
    font-weight: 200;
    font-size: 14px;
    color: #999999;
  }
`;

export const NewPatientForm = memo(
  ({ editedObject, onSubmit, onCancel, generateId, patientSuggester, facilitySuggester }) => {
    const [isRevealed, toggleRevealed] = useState(false);
    const renderForm = ({ submitForm, values }) => {
      return (
        <FormGrid>
          <IdBanner>
            <Field name="_id" component={IdField} regenerateId={generateId} disabled />
          </IdBanner>
          <Field name="firstName" label="First name" component={TextField} required />
          <Field name="middleName" label="Middle name" component={TextField} />
          <Field name="lastName" label="Last name" component={TextField} required />
          <Field name="culturalName" label="Cultural/Traditional name" component={TextField} />
          <Field name="dateOfBirth" label="Date of birth" component={DateField} required />
          <Field
            name="sex"
            label="Sex"
            component={RadioField}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            inline
            required
          />
          <AdditionalInformationRow>
            <div>
              Add additional information <span>(religion, occupation, blood type...)</span>
            </div>
            {isRevealed ? (
              <MinusIconButton onClick={() => toggleRevealed(!isRevealed)} />
            ) : (
              <PlusIconButton onClick={() => toggleRevealed(!isRevealed)} />
            )}
          </AdditionalInformationRow>
          <Collapse in={isRevealed} style={{ gridColumn: 'span 2' }}>
            <FormGrid>
              <Field name="religion" label="Religion" component={TextField} />
              <Field name="occupation" label="Occupation" component={TextField} />
              <Field
                name="mother"
                label="Mother"
                component={AutocompleteField}
                suggester={patientSuggester}
              />
              <Field
                name="father"
                label="Father"
                component={AutocompleteField}
                suggester={patientSuggester}
              />
              <Field name="externalId" label="External patient ID" component={TextField} />
              <Field
                component={RadioField}
                name="patientType"
                label="Patient Type"
                options={[
                  { value: 'charity', label: 'Charity' },
                  { value: 'private', label: 'Private' },
                ]}
                inline
              />
              <Field name="bloodType" label="Blood type" component={TextField} />
              <Field name="placeOfBirth" label="Place of birth" component={TextField} />
              <Field name="referredBy" label="Referred by" component={TextField} />
              <Field name="referredDate" label="Referred date" component={DateField} />
              <Field
                name="homeClinic"
                label="Home clinic"
                component={AutocompleteField}
                suggester={facilitySuggester}
              />
            </FormGrid>
          </Collapse>
          <ActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      );
    };

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          _id: generateId(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          firstName: yup.string().required(),
          middleName: yup.string(),
          lastName: yup.string().required(),
          culturalName: yup.string(),
          dateOfBirth: yup.date().required(),
          sex: yup.string().oneOf(['male', 'female', 'other']),

          religion: yup.string(),
          occupation: yup.string(),
          mother: yup.string(),
          father: yup.string(),
          externalId: yup.string(),
          patientType: yup.string(),
        })}
      />
    );
  },
);
