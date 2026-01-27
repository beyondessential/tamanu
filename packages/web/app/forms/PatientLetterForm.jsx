import React, { useCallback, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import {
  MultilineTextField,
  TextField,
  Form,
  Button,
  OutlinedButton,
  FormGrid,
  ModalLoader,
  TranslatedText,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { useApi, useSuggester } from '../api';
import { useAuth } from '../contexts/Auth';
import { AutocompleteField, DateField, Field } from '../components/Field';
import { PatientDetailsCard } from '../components/PatientDetailsCard';
import { ModalGenericButtonRow } from '../components/ModalActionRow';
import { TEMPLATE_TYPES, FORM_TYPES } from '@tamanu/constants';

const TallMultilineTextField = props => (
  <MultilineTextField
    style={{ minHeight: '156px' }}
    {...props}
    data-testid="multilinetextfield-qfz7"
  />
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
      <FormGrid columns={2} nested data-testid="formgrid-z2jg">
        <Field
          name="clinicianId"
          label={
            <TranslatedText
              stringId="general.clinician.label"
              fallback="Clinician"
              data-testid="translatedtext-heei"
            />
          }
          required
          component={AutocompleteField}
          suggester={practitionerSuggester}
          data-testid="field-ytix"
        />
        <Field
          name="date"
          label={
            <TranslatedText
              stringId="general.date.label"
              fallback="Date"
              data-testid="translatedtext-qk9r"
            />
          }
          required
          component={DateField}
          saveDateAsString
          data-testid="field-idv4"
        />
      </FormGrid>
      <StyledFormGrid columns={1} data-testid="styledformgrid-vdsg">
        <Field
          name="templateId"
          label={
            <TranslatedText
              stringId="patientLetter.template.label"
              fallback="Template"
              data-testid="translatedtext-u6i4"
            />
          }
          suggester={patientLetterTemplateSuggester}
          component={AutocompleteField}
          onChange={e => onChangeTemplate(e.target.value)}
          data-testid="field-befh"
        />
        <Field
          name="title"
          label={
            <TranslatedText
              stringId="patientLetter.title.label"
              fallback="Letter title"
              data-testid="translatedtext-q7ng"
            />
          }
          required
          component={TextField}
          disabled={templateLoading}
          data-testid="field-f2bj"
        />
        <Field
          name="body"
          label={
            <TranslatedText
              stringId="general.note.label"
              fallback="Note"
              data-testid="translatedtext-wpkj"
            />
          }
          required
          component={TallMultilineTextField}
          disabled={templateLoading}
          data-testid="field-d4xx"
        />
      </StyledFormGrid>
      <ModalGenericButtonRow data-testid="modalgenericbuttonrow-qbz5">
        <FinaliseAndPrintButton
          onClick={e => submitForm(e, { printRequested: true })}
          data-testid="finaliseandprintbutton-rtc8"
        >
          <TranslatedText
            stringId="patientLetter.action.finaliseAndPrint"
            fallback="Finalise & Print"
            data-testid="translatedtext-z4d9"
          />
        </FinaliseAndPrintButton>
        <Gap data-testid="gap-ud1x" />
        <OutlinedButton onClick={onCancel} data-testid="outlinedbutton-5nu1">
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
            data-testid="translatedtext-ry4a"
          />
        </OutlinedButton>
        <Button onClick={submitForm} data-testid="button-4eqi">
          <TranslatedText
            stringId="general.action.finalise"
            fallback="Finalise"
            data-testid="translatedtext-oeih"
          />
        </Button>
      </ModalGenericButtonRow>
    </>
  );
};

export const PatientLetterForm = ({ onSubmit, onCancel, editedObject, endpoint, patient }) => {
  const { currentUser, facilityId } = useAuth();
  const { getCountryCurrentDateString } = useDateTimeFormat();
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
            data-testid="translatedtext-md5j"
          />
        }
        data-testid="modalloader-yb18"
      />
    ) : (
      <>
        <PatientDetailsCard patient={patient} data-testid="patientdetailscard-bf19" />
        <PatientLetterFormContents
          onCancel={onCancel}
          {...props}
          data-testid="patientletterformcontents-q29t"
        />
      </>
    );

  return (
    <Form
      onSubmit={handleSubmit}
      render={renderForm}
      initialValues={{
        date: getCountryCurrentDateString(),
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        date: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.date.label"
              fallback="Date"
              data-testid="translatedtext-lqzd"
            />,
          ),
        clinicianId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid="translatedtext-pvkf"
            />,
          ),
        title: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patientLetter.title.label"
              fallback="Letter title"
              data-testid="translatedtext-feou"
            />,
          ),
        body: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.note.label"
              fallback="Note"
              data-testid="translatedtext-8f3k"
            />,
          ),
      })}
      data-testid="form-ouu3"
    />
  );
};
