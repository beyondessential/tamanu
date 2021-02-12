import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { connectApi } from '../api';

import { Colors } from '../constants';
import { Button } from './Button';
import { ButtonRow } from './ButtonRow';
import { Form, Field, TextField } from './Field';
import { CarePlanNoteDisplay } from './CarePlanNoteDisplay';

const Container = styled.div`
  min-height: 50vh;
`;

const NotesSection = styled.section`
  margin-top: 2rem;
`;

const SubmitError = styled.div`
  color: ${Colors.alert};
  padding: 0.25rem;
`;

function NoteForm(props) {
  const [submitError, setSubmitError] = useState('');
  return (
    <Form
      onSubmit={async values => {
        try {
          await props.submitNote(props.carePlanId, values);
          setSubmitError('');
          props.onSuccessfulSubmit();
        } catch (e) {
          setSubmitError('An error occurred. Please try again.');
        }
        // reload notes on failure just in case it was recorded
        props.reloadNotes();
      }}
      render={() => {
        return (
          <>
            <Field
              name="note"
              placeholder="Write a note..."
              component={TextField}
              multiline
              rows={4}
            />
            <SubmitError>{submitError}</SubmitError>
            <ButtonRow>
              <Button variant="outlined" color="primary" type="submit">
                Add Note
              </Button>
            </ButtonRow>
          </>
        );
      }}
    />
  );
}


function DumbPatientCarePlanDetails(props) {
  const [firstNote, setFirstNote] = useState();
  const [subsequentNotes, setSubsequentNotes] = useState([]);
  const [resetForm, setResetForm] = useState(0);
  const [reloadNotes, setReloadNotes] = useState(0);

  useEffect(() => {
    props.getNotes(props.item.id).then(notes => {
      if (notes.length) {
        // first note is the main care plan
        setFirstNote(notes[0]);

        if (notes.length > 1) {
          // display the latest note first
          setSubsequentNotes(
            notes.slice(1).sort((a, b) => {
              return moment(a.updatedAt).isBefore(b.updatedAt) ? 1 : -1;
            }),
          );
        }
      }
    });
  }, [props.item.id, reloadNotes]);

  return (
    <Container>
      <NoteForm
        key={resetForm}
        submitNote={props.submitNote}
        carePlanId={props.item.id}
        reloadNotes={() => {
          setReloadNotes(reloadNotes + 1);
        }}
        onSuccessfulSubmit={() => {
          setResetForm(resetForm + 1);
        }}
      />
      {firstNote ? (
        <NotesSection>
          <CarePlanNoteDisplay note={firstNote} isMainCarePlan />
          {subsequentNotes.length
            ? subsequentNotes.map((note, index) => <CarePlanNoteDisplay key={index} note={note} />)
            : null}
        </NotesSection>
      ) : null}
    </Container>
  );
}

export const PatientCarePlanDetails = connectApi(api => ({
  submitNote: async (patientCarePlanId, body) => {
    return await api.post(`patientCarePlan/${patientCarePlanId}/notes`, body);
  },
  getNotes: async patientCarePlanId => {
    return await api.get(`patientCarePlan/${patientCarePlanId}/notes`);
  },
}))(DumbPatientCarePlanDetails);
