import React, { memo } from 'react';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';

import {
  Form,
  Field,
  DateField,
  AutocompleteField,
  TextField,
  CheckField,
  RadioField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export const NewPatientForm = memo(
  ({ editedObject, onSubmit, onCancel, generateId, patientSuggester, facilitySuggester }) => {
    const renderForm = ({ submitForm, values }) => {
      const revealAdditionalFields = values.revealAdditionalFields;
      return (
        <FormGrid>
          <Field name="_id" label="National health ID" component={TextField} />
          <Field name="firstName" label="First name" component={TextField} required />
          <Field name="middleName" label="Middle name" component={TextField} />
          <Field name="lastName" label="Last name" component={TextField} required />
          <Field name="culturalName" label="Cultural/Traditional name" component={TextField} />
          <Field name="dateOfBirth" label="Date of birth" component={DateField} required />
          <Field
            name="revealAdditionalFields"
            label="Add additional information (religion, occupation, blood type...)"
            component={CheckField}
            style={{ gridColumn: 'span 2' }}
          />
          <Collapse in={revealAdditionalFields} style={{ gridColumn: 'span 2' }}>
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
          <ConfirmCancelRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
        </FormGrid>
      );
    };

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          _id: generateId(),
          revealAdditionalFields: false,
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
