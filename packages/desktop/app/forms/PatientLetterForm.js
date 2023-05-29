import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { useApi, useSuggester } from '../api';
import { useAuth } from '../contexts/Auth';
import {
  Form,
  Field,
  TextField,
  MultilineTextField,
  DateField,
  AutocompleteField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { OutlinedButton, Button } from '../components';
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

const PatientLetterFormContents = ({ submitForm, onCancel, setFieldValue }) => {
  const [templateId, setTemplateId] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(null);

  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const patientLetterTemplateSuggester = useSuggester('patientLetterTemplate');

  useEffect(() => {
    const updateValues = async () => {
      const template = await api.get(`patientLetterTemplate/${templateId}`);
      setValues({ 
        title: template.title,
        body: template.body,
      });
      setTemplateLoading(false);
    };

    if (templateId) {
      setTemplateLoading(true);
      updateValues();
    }
  }, [templateId, api, setFieldValue]);

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
        <Field name="date" label="Date" required component={DateField} saveDateAsString />
      </FormGrid>
      <FormGrid columns={1}>
        <Field
          name="templateId"
          label="Template"
          suggester={patientLetterTemplateSuggester}
          required
          component={AutocompleteField}
          onChange={e => setTemplateId(e.target.value)}
        />
        <Field name="title" label="Letter title" component={TextField} disabled={templateLoading} />
        <Field
          name="body"
          label="Note"
          component={TallMultilineTextField}
          disabled={templateLoading}
        />
      </FormGrid>
      <ModalButtonRow>
        <FinaliseAndPrintButton
          onClick={e => submitForm(e, { printRequested: true })}
        >
          Finalise & Print
        </FinaliseAndPrintButton>
        <Gap />
        <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
        <Button onClick={submitForm}>Finalise</Button>
      </ModalButtonRow>
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject }) => {
  const { currentUser } = useAuth();

  return (
    <Form
      onSubmit={onSubmit}
      render={props => <PatientLetterFormContents onCancel={onCancel} {...props} />}
      initialValues={{
        date: getCurrentDateString(),
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({})}
    />
  );
};
