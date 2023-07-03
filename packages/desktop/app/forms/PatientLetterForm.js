import React, { useState, useCallback } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';

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
import { ModalLoader } from '../components/Modal';
import { OutlinedButton, Button } from '../components';
import { PatientDetailsCard } from '../components/PatientDetailsCard';
import { ModalGenericButtonRow } from '../components/ModalActionRow';

const TallMultilineTextField = props => (
  <MultilineTextField style={{ minHeight: '156px' }} {...props} />
);

const FinaliseAndPrintButton = styled(OutlinedButton)`
  margin-left: 0px !important;
`;

const Gap = styled.div`
  margin-left: auto !important;
`;

const PatientLetterFormContents = ({ submitForm, onCancel, setValues }) => {
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const patientLetterTemplateSuggester = useSuggester('patientLetterTemplate');

  const [templateLoading, setTemplateLoading] = useState(false);

  const onChangeTemplate = useCallback(
    async templateId => {
      if (!templateId) {
        return;
      }
      setTemplateLoading(true);
      const template = await api.get(`patientLetterTemplate/${templateId}`);
      setValues(values => ({
        ...values,
        title: template.title,
        body: template.body,
      }));

      setTemplateLoading(false);
    },
    [api, setTemplateLoading, setValues],
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
        <Field name="date" label="Date" required component={DateField} saveDateAsString />
      </FormGrid>
      <FormGrid columns={1}>
        <Field
          name="templateId"
          label="Template"
          suggester={patientLetterTemplateSuggester}
          required
          component={AutocompleteField}
          onChange={e => onChangeTemplate(e.target.value)}
        />
        <Field name="title" label="Letter title" component={TextField} disabled={templateLoading} />
        <Field
          name="body"
          label="Note"
          component={TallMultilineTextField}
          disabled={templateLoading}
        />
      </FormGrid>
      <ModalGenericButtonRow>
        <FinaliseAndPrintButton onClick={e => submitForm(e, { printRequested: true })}>
          Finalise & Print
        </FinaliseAndPrintButton>
        <Gap />
        <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
        <Button onClick={submitForm}>Finalise</Button>
      </ModalGenericButtonRow>
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject, patient }) => {
  const { currentUser } = useAuth();

  const renderForm = props =>
    props.isSubmitting ? (
      <ModalLoader loadingText="Please wait while we create your patient letter" />
    ) : (
      <>
        <PatientDetailsCard patient={patient} />
        <PatientLetterFormContents onCancel={onCancel} {...props} />
      </>
    );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        date: getCurrentDateString(),
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({})}
    />
  );
};
