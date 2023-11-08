import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi, useSuggester } from '../api';
import { Colors } from '../constants';
import { FormSubmitCancelRow } from './ButtonRow';
import { Form, Field, TextField, DateTimeField, AutocompleteField } from './Field';
import { FormGrid } from './FormGrid';
import { TranslatedText } from './Translation/TranslatedText';

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
        content: yup.string().required('Content is required'),
      })}
      render={() => (
        <>
          <FormGrid columns={2}>
            <Field
              name="onBehalfOfId"
              label={
                <TranslatedText
                  stringId="carePlan.form.noteOnBehalfOf.label"
                  fallback="On Behalf Of"
                />
              }
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="date"
              label={
                <TranslatedText
                  stringId="carePlan.form.noteDateRecorded.label"
                  fallback="Date Recorded"
                />
              }
              component={DateTimeField}
              saveDateAsString
            />
          </FormGrid>
          <FormGrid columns={1}>
            <Field
              name="content"
              placeholder="Write a note..."
              component={TextField}
              required
              multiline
              rows={4}
            />
          </FormGrid>
          <SubmitError>{submitError}</SubmitError>
          <FormSubmitCancelRow
            onCancel={note ? onCancel : null}
            confirmText={
              note ? (
                <TranslatedText stringId="general.action.save" fallback="Save" />
              ) : (
                <TranslatedText stringId="carePlan.action.addNote" fallback="Add Note" />
              )
            }
          />
        </>
      )}
    />
  );
}
