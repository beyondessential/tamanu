import React, { useCallback, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { getCurrentDateString } from '@tamanu/utils/dateTime';

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
import { TEMPLATE_TYPES } from '@tamanu/constants';

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
  const patientLetterTemplateSuggester = useSuggester('template', {
    baseQueryParameters: { type: TEMPLATE_TYPES.PATIENT_LETTER },
  });

  const [templateLoading, setTemplateLoading] = useState(false);

  const onChangeTemplate = useCallback(
    async templateId => {
      if (!templateId) {
        return;
      }
      setTemplateLoading(true);
      const template = await api.get(`template/${templateId}`);
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
          label={<TranslatedText
            stringId="general.clinician.label"
            fallback="Clinician"
            data-testid='translatedtext-dm56' />}
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid='field-055d' />
        <Field
          name="date"
          label={<TranslatedText
            stringId="general.date.label"
            fallback="Date"
            data-testid='translatedtext-k7sx' />}
          required
          component={DateField}
          saveDateAsString
          data-testid='field-ok7z' />
      </FormGrid>
      <StyledFormGrid columns={1}>
        <Field
          name="templateId"
          label={<TranslatedText
            stringId="patientLetter.template.label"
            fallback="Template"
            data-testid='translatedtext-vk0w' />}
          suggester={patientLetterTemplateSuggester}
          component={AutocompleteField}
          onChange={e => onChangeTemplate(e.target.value)}
          data-testid='field-kz1a' />
        <Field
          name="title"
          label={<TranslatedText
            stringId="patientLetter.title.label"
            fallback="Letter title"
            data-testid='translatedtext-dvw7' />}
          required
          component={TextField}
          disabled={templateLoading}
          data-testid='field-i5yg' />
        <Field
          name="body"
          label={<TranslatedText
            stringId="general.note.label"
            fallback="Note"
            data-testid='translatedtext-vj91' />}
          required
          component={TallMultilineTextField}
          disabled={templateLoading}
          data-testid='field-faf7' />
      </StyledFormGrid>
      <ModalGenericButtonRow>
        <FinaliseAndPrintButton onClick={e => submitForm(e, { printRequested: true })}>
          <TranslatedText
            stringId="patientLetter.action.finaliseAndPrint"
            fallback="Finalise & Print"
            data-testid='translatedtext-v2ve' />
        </FinaliseAndPrintButton>
        <Gap />
        <OutlinedButton onClick={onCancel} data-testid='outlinedbutton-m3ts'>
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid='translatedtext-ft85' />
        </OutlinedButton>
        <Button onClick={submitForm} data-testid='button-8e90'>
          <TranslatedText
            stringId="general.action.finalise"
            fallback="Finalise"
            data-testid='translatedtext-8rdj' />
        </Button>
      </ModalGenericButtonRow>
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject, endpoint, patient }) => {
  const { currentUser, facilityId } = useAuth();
  const api = useApi();

  const handleSubmit = useCallback(
    async ({ printRequested, ...data }) => {
      const document = await api.post(endpoint, {
        patientLetterData: {
          ...data,
          patient,
        },
        facilityId,
        name: data.title,
        clinicianId: data.clinicianId,
      });
      const documentToOpen = printRequested ? document : null;
      onSubmit(documentToOpen);
    },
    [api, endpoint, onSubmit, patient, facilityId],
  );

  const renderForm = props =>
    props.isSubmitting ? (
      <ModalLoader
        loadingText={
          <TranslatedText
            stringId="patientLetter.modal.create.loadingText"
            fallback="Please wait while we create your patient letter"
            data-testid='translatedtext-v45n' />
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
        date: yup
          .date()
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid='translatedtext-aj9q' />),
        clinicianId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid='translatedtext-zbqn' />,
          ),
        title: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patientLetter.title.label"
              fallback="Letter title"
              data-testid='translatedtext-jtnl' />,
          ),
        body: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.note.label"
          fallback="Note"
          data-testid='translatedtext-c0mv' />),
      })}
    />
  );
};
