import React, { useState, useCallback, useEffect } from 'react';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { useQuery } from '@tanstack/react-query'

import { useApi, useSuggester } from '../api';
import { AutocompleteInput } from '../components/Field/AutocompleteField';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { Form, Field, TextField, MultilineTextField, SelectField, DateField, AutocompleteField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const TallMultilineTextField = props => (
  <MultilineTextField style={{ minHeight: '156px' }} {...props} />
);


const DumbPatientLetterForm = ({ submitForm, setFieldValue }) => {
  const [templateId, setTemplateId] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(null);

  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const patientLetterTemplateSuggester = useSuggester('patientLetterTemplate');

  useEffect(() => {
      const updateValues = async () => {
        const template = await api.get(`patientLetterTemplate/${templateId}`);
        if (template) {
          setFieldValue('title', template.title);
          setFieldValue('body', template.body);
        }
        setTemplateLoading(false);
      }

      if(templateId) {
        setTemplateLoading(true);
        updateValues();
      }
    }, 
    [templateId],
  );

  
  // console.log('templateLoading', templateLoading);
  // console.log('templateId', templateId);
  // console.log('patientLetterTemplateId', template);

  return (
    <>
      <FormGrid columns={2} nested>
        <Field
          name="clinicianId"
          label="Clinician"
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="date"
          label="Date"
          required
          component={DateField}
          saveDateAsString
        />
      </FormGrid>
      <FormGrid columns={1}>
        <Field
          name="templateId"
          label="Template"
          suggester={patientLetterTemplateSuggester}
          required
          component={AutocompleteField}
          onChange={event => console.log(event.target.value) || setTemplateId(event.target.value)}
        />
        <Field name="title" label="Letter title" component={TextField} disabled={templateLoading} />
        <Field name="body" label="Note" component={TallMultilineTextField} disabled={templateLoading} />
      </FormGrid>
      <ConfirmCancelRow confirmText="Finalise" onConfirm={submitForm} onCancel={onCancel} />
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject }) => {
  return (
    <Form
      onSubmit={onSubmit}
      render={props => <DumbPatientLetterForm onCancel={onCancel} {...props} />}
      initialValues={{
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
      })}
    />
  );
};
