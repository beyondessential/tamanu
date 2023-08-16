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

const StyledFormGrid = styled(FormGrid)`
  margin-top: 1.2rem;
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
      <StyledFormGrid columns={1}>
        <Field
          name="templateId"
          label="Template"
          suggester={patientLetterTemplateSuggester}
          component={AutocompleteField}
          onChange={e => onChangeTemplate(e.target.value)}
        />
        <Field
          name="title"
          label="Letter title"
          required
          component={TextField}
          disabled={templateLoading}
        />
        <Field
          name="body"
          label="Note"
          required
          component={TallMultilineTextField}
          disabled={templateLoading}
        />
      </StyledFormGrid>
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

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject, endpoint, patient }) => {
  const { currentUser, facility } = useAuth();
  const api = useApi();

  const handleSubmit = useCallback(
    async ({ printRequested, ...data }) => {
      const document = await api.post(endpoint, {
        patientLetterData: {
          ...data,
          patient,
        },
        name: data.title,
        clinicianId: data.clinicianId,
        facilityId: facility.id,
      });
      const documentToOpen = printRequested ? document : null;
      onSubmit(documentToOpen);
    },
    [api, endpoint, onSubmit, patient, facility.id],
  );

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
      onSubmit={handleSubmit}
      render={renderForm}
      initialValues={{
        date: getCurrentDateString(),
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        date: yup.date().required('Date is required'),
        clinicianId: yup.string().required('Clinician is required'),
        title: yup.string().required('Letter title is required'),
        body: yup.string().required('Note is required'),
      })}
    />
  );
};
