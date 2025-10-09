import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useApi, useSuggester } from '../api';
import { FORM_TYPES } from '@tamanu/constants';
import {
  TextField,
  Form,
  FormSubmitCancelRow,
  FormGrid,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { AutocompleteField, DateTimeField, Field } from './Field';
import { TranslatedText } from './Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';

const SubmitError = styled.div`
  color: ${Colors.alert};
  padding: 0.25rem;
`;

export function CarePlanNoteForm({
  note,
  carePlanId,
  onReloadNotes,
  onSuccessfulSubmit,
  onCancel,
}) {
  const { getTranslation } = useTranslation();

  const [submitError, setSubmitError] = useState('');
  const practitionerSuggester = useSuggester('practitioner');
  const api = useApi();

  const submitNote = async (patientCarePlanId, body) =>
    api.post(`patientCarePlan/${patientCarePlanId}/notes`, body);

  const updateNote = async updatedNote => api.put(`notes/${updatedNote.id}`, updatedNote);
  return (
    <Form
      onSubmit={async values => {
        try {
          if (note) {
            await updateNote({ ...note, ...values });
          } else {
            await submitNote(carePlanId, values);
          }
          setSubmitError('');
          onSuccessfulSubmit();
        } catch (e) {
          setSubmitError('An error occurred. Please try again.');
        }
        // reload notes on failure just in case it was recorded
        onReloadNotes();
      }}
      initialValues={note || { date: getCurrentDateTimeString() }}
      validationSchema={yup.object().shape({
        content: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="note.validation.content.path"
              fallback="Content"
              data-testid="translatedtext-ht1b"
            />,
          ),
      })}
      formType={note ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      render={() => (
        <>
          <FormGrid columns={2} data-testid="formgrid-fndf">
            <Field
              name="onBehalfOfId"
              label={
                <TranslatedText
                  stringId="carePlan.noteOnBehalfOf.label"
                  fallback="On behalf of"
                  data-testid="translatedtext-dyao"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-hh8q"
            />
            <Field
              name="date"
              label={
                <TranslatedText
                  stringId="carePlan.noteDateRecorded.label"
                  fallback="Date Recorded"
                  data-testid="translatedtext-7ylt"
                />
              }
              component={DateTimeField}
              saveDateAsString
              data-testid="field-qouz"
            />
          </FormGrid>
          <FormGrid columns={1} data-testid="formgrid-fw7y">
            <Field
              name="content"
              placeholder={getTranslation('carePlan.note.placeholder.writeNote', 'Write a note...')}
              component={TextField}
              required
              multiline
              minRows={4}
              data-testid="field-e8ln"
            />
          </FormGrid>
          <SubmitError data-testid="submiterror-89ce">{submitError}</SubmitError>
          <FormSubmitCancelRow
            onCancel={note ? onCancel : null}
            confirmText={
              note ? (
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid="translatedtext-6uku"
                />
              ) : (
                <TranslatedText
                  stringId="general.action.addNote"
                  fallback="Add note"
                  data-testid="translatedtext-97gm"
                />
              )
            }
            data-testid="formsubmitcancelrow-2egx"
          />
        </>
      )}
      data-testid="form-e8ca"
    />
  );
}
