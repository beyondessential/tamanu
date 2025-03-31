import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useApi, useSuggester } from '../api';
import { Colors, FORM_TYPES } from '../constants';
import { FormSubmitCancelRow } from './ButtonRow';
import { AutocompleteField, DateTimeField, Field, Form, TextField } from './Field';
import { FormGrid } from './FormGrid';
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
              data-testid='translatedtext-y8xx' />,
          ),
      })}
      formType={note ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      render={() => (
        <>
          <FormGrid columns={2}>
            <Field
              name="onBehalfOfId"
              label={
                <TranslatedText
                  stringId="carePlan.noteOnBehalfOf.label"
                  fallback="On behalf of"
                  data-testid='translatedtext-6kqk' />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid='field-4nym' />
            <Field
              name="date"
              label={
                <TranslatedText
                  stringId="carePlan.noteDateRecorded.label"
                  fallback="Date Recorded"
                  data-testid='translatedtext-y4jp' />
              }
              component={DateTimeField}
              saveDateAsString
              data-testid='field-jrnf' />
          </FormGrid>
          <FormGrid columns={1}>
            <Field
              name="content"
              placeholder={getTranslation('carePlan.note.placeholder.writeNote', 'Write a note...')}
              component={TextField}
              required
              multiline
              minRows={4}
              data-testid='field-70rg' />
          </FormGrid>
          <SubmitError>{submitError}</SubmitError>
          <FormSubmitCancelRow
            onCancel={note ? onCancel : null}
            confirmText={
              note ? (
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid='translatedtext-be5b' />
              ) : (
                <TranslatedText
                  stringId="general.action.addNote"
                  fallback="Add Note"
                  data-testid='translatedtext-y7sj' />
              )
            }
            data-testid='formsubmitcancelrow-ssca' />
        </>
      )}
    />
  );
}
