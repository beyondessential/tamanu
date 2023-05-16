import React, { useState, useCallback, useEffect } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useFormik } from 'formik';
import { useQuery } from '@tanstack/react-query'

import { useApi, useSuggester } from '../api';
import { AutocompleteInput } from '../components/Field/AutocompleteField';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { Form, Field, TextField, MultilineTextField, SelectField, DateField, AutocompleteField } from '../components/Field';
import { FileChooserField } from '../components/Field/FileChooserField';
import { FormGrid } from '../components/FormGrid';
import { OutlinedButton, Button } from '../components';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ModalButtonRow } from '../components/ModalActionRow';

const TallMultilineTextField = props => (
  <MultilineTextField style={{ minHeight: '156px' }} {...props} />
);

const FinaliseAndPrintButton = styled(OutlinedButton)`
  margin-left: 0px !important;
`;

const Gap = styled.div`
  margin-left: auto !important;
`;

const DumbPatientLetterForm = ({ isSubmitting, submitForm, onCancel, setFieldValue }) => {
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
      <ModalButtonRow>
        <FinaliseAndPrintButton onClick={e => submitForm(e, {submissionType: 'FinaliseAndPrint'})}>Finalise & Print</FinaliseAndPrintButton>
        <Gap />
        <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
        <Button onClick={e => submitForm(e, {submissionType: 'Finalise'})}>Finalise</Button>
      </ModalButtonRow>
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject }) => {
  const { currentUser } = useAuth();

  return (
    <Form
      onSubmit={onSubmit}
      render={props => <DumbPatientLetterForm onCancel={onCancel} {...props} />}
      initialValues={{
        date: getCurrentDateString(),
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
      })}
    />
  );
};
