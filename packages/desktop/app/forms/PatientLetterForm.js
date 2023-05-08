import React, { useState } from 'react';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query'

import { useApi, useSuggester } from '../api';
import { AutocompleteInput } from '../components/Field/AutocompleteField';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { Form, Field, TextField, MultilineTextField, SelectField, DateField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const TallMultilineTextField = props => (
  <MultilineTextField style={{ minHeight: '156px' }} {...props} />
);

export const PatientLetterForm = ({ actionText, onSubmit, onCancel, editedObject }) => {
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const [patientLetterTemplateId, setPatientLetterTemplateId] = useState(null);

  const { data: patientLetterTemplate, isLoading: patientLetterTemplateLoading } = useQuery(
    ['patientLetterTemplate', patientLetterTemplateId],
    () => api.get(`patientLetterTemplate/${patientLetterTemplateId}`),
    {
      enabled: !!patientLetterTemplateId,
    },
  );

  const renderForm = ({ submitForm }) => (
    <>
      <FormGrid columns={2}>
        <AutocompleteInput
          name="clinicianId"
          label="Clinician"
          suggester={practitionerSuggester}
          required
        />
        <Field
          name="date"
          label="Date"
          required
          component={DateField}
          saveDateAsString
        />
      </FormGrid>
      <FormGrid columns={1} nested>
        <Field
          name="template"
          label="Template"
          options={[{label: 'hi', value: 'hi'}]}
          required
          component={SelectField}
          onChange={event => console.log(event.target.value) /* setPatientLetterTemplateId(event.target.value) */}
        />
        <Field name="title" label="Letter title" component={TextField} />
        <Field name="body" label="Note" component={TallMultilineTextField} />
      </FormGrid>
      <ConfirmCancelRow confirmText={actionText} onConfirm={submitForm} onCancel={onCancel} />
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
      })}
    />
  );
};
