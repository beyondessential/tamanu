import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { connectApi } from '../api';

import { Colors } from '../constants';
import { Button } from './Button';
import { ButtonRow } from './ButtonRow';
import { Form, Field, TextField } from './Field';

const Container = styled.div`
  min-height: 50vh;
`;

const NotesSection = styled.section`
  margin-top: 2rem;
`;

const NoteContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background-color: ${Colors.white};
  margin-bottom: 0.75rem;
`;

const NoteHeaderContainer = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  justify-content: space-between;
`;

const NoteAuthorName = styled.strong`
  color: ${Colors.darkText};
`;

const MainCarePlanIndicator = styled.strong`
  color: ${Colors.alert};
  padding-left: 1rem;
`;

const Timestamp = styled.span`
  color: ${Colors.midText};
`;

const NoteContentContainer = styled.div`
  padding-left: 1rem;
  padding-right: 1rem;
`;

const NoteContent = styled.p`
  color: ${Colors.midText};
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

function Note(props) {
  return (
    <NoteContainer>
      <NoteHeaderContainer>
        <div>
          <NoteAuthorName>{props.note.author.displayName}</NoteAuthorName>
          {props.isMainCarePlan ? (
            <MainCarePlanIndicator>Main Care Plan</MainCarePlanIndicator>
          ) : null}
        </div>
        <div>
          <Timestamp>{moment(props.note.updatedAt).format('LLLL')}</Timestamp>
        </div>
      </NoteHeaderContainer>
      <NoteContentContainer>
        <NoteContent>{props.note.content}</NoteContent>
      </NoteContentContainer>
    </NoteContainer>
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
          <Note note={firstNote} isMainCarePlan />
          {subsequentNotes.length
            ? subsequentNotes.map((note, index) => <Note key={index} note={note} />)
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
