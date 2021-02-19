import React, { useState } from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { Button } from './Button';
import { ButtonRow } from './ButtonRow';

import { Form, Field, TextField, DateTimeField, AutocompleteField } from './Field';
import { FormGrid } from './FormGrid';

const SubmitError = styled.div`
  color: ${Colors.alert};
  padding: 0.25rem;
`;

export function CarePlanNoteForm(props) {
  const [submitError, setSubmitError] = useState('');
  return (
    <Form
      onSubmit={async values => {
        try {
          await props.onSubmit(values);
          setSubmitError('');
          props.onSuccessfulSubmit();
        } catch (e) {
          setSubmitError('An error occurred. Please try again.');
        }
        // reload notes on failure just in case it was recorded
        props.onReloadNotes();
      }}
      initialValues={props.note || { date: new Date() }}
      render={() => {
        return (
          <>
            <FormGrid columns={2}>
              <Field
                name="onBehalfOfId"
                label="On Behalf Of"
                component={AutocompleteField}
                suggester={props.practitionerSuggester}
              />
              <Field name="date" label="Date recorded" component={DateTimeField} />
            </FormGrid>
            <FormGrid columns={1}>
              <Field
                name="content"
                placeholder="Write a note..."
                component={TextField}
                multiline
                rows={4}
              />
            </FormGrid>
            <SubmitError>{submitError}</SubmitError>
            <ButtonRow>
              {props.note ? (
                <Button variant="contained" onClick={props.onCancel}>
                  Cancel
                </Button>
              ) : (
                <div />
              )}
              <Button variant="outlined" color="primary" type="submit">
                {props.note ? 'Save' : 'Add Note'}
              </Button>
            </ButtonRow>
          </>
        );
      }}
    />
  );
}
