import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { useApi, useSuggester } from '../api';
import { Colors } from '../constants';
import { FormSubmitCancelRow } from './ButtonRow';
import { AutocompleteField, DateTimeField, Field, Form, TextField } from './Field';
import { FormGrid } from './FormGrid';

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
              label="On Behalf Of"
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field name="date" label="Date recorded" component={DateTimeField} saveDateAsString />
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
            confirmText={note ? 'Save' : 'Add Note'}
          />
        </>
      )}
    />
  );
}
