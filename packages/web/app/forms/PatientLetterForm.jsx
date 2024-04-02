import React, { useCallback, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';

import { useApi, useSuggester } from '../api';
import { useAuth } from '../contexts/Auth';
import {
  AutocompleteField,
  DateField,
  Field,
  Form,
  MultilineTextField,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalLoader } from '../components/BaseModal';
import { Button, OutlinedButton } from '../components';
import { PatientDetailsCard } from '../components/PatientDetailsCard';
import { ModalGenericButtonRow } from '../components/ModalActionRow';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { localisedErrorLabel } from '../utils/errorMessages';

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
          label={<TranslatedText stringId="general.clinician.label" fallback="Clinician" />}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
        />
        <Field
          name="date"
          label={<TranslatedText stringId="general.date.label" fallback="Date" />}
          required
          component={DateField}
          saveDateAsString
        />
      </FormGrid>
      <StyledFormGrid columns={1}>
        <Field
          name="templateId"
          label={<TranslatedText stringId="patientLetter.template.label" fallback="Template" />}
          suggester={patientLetterTemplateSuggester}
          component={AutocompleteField}
          onChange={e => onChangeTemplate(e.target.value)}
        />
        <Field
          name="title"
          label={<TranslatedText stringId="patientLetter.title.label" fallback="Letter title" />}
          required
          component={TextField}
          disabled={templateLoading}
        />
        <Field
          name="body"
          label={<TranslatedText stringId="general.note.label" fallback="Note" />}
          required
          component={TallMultilineTextField}
          disabled={templateLoading}
        />
      </StyledFormGrid>
      <ModalGenericButtonRow>
        <FinaliseAndPrintButton onClick={e => submitForm(e, { printRequested: true })}>
          <TranslatedText
            stringId="patientLetter.action.finaliseAndPrint"
            fallback="Finalise & Print"
          />
        </FinaliseAndPrintButton>
        <Gap />
        <OutlinedButton onClick={onCancel}>
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </OutlinedButton>
        <Button onClick={submitForm}>
          <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
        </Button>
      </ModalGenericButtonRow>
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject, endpoint, patient }) => {
  const { currentUser } = useAuth();
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
      });
      const documentToOpen = printRequested ? document : null;
      onSubmit(documentToOpen);
    },
    [api, endpoint, onSubmit, patient],
  );

  const renderForm = props =>
    props.isSubmitting ? (
      <ModalLoader
        loadingText={
          <TranslatedText
            stringId="patientLetter.modal.create.loadingText"
            fallback="Please wait while we create your patient letter"
          />
        }
      />
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
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        date: yup.date().required(),
        clinicianId: yup
          .string()
          .required()
          .label(localisedErrorLabel('clinician')),
        title: yup
          .string()
          .required()
          .label('letterTitle'),
        body: yup
          .string()
          .required()
          .label('note'),
      })}
    />
  );
};
