import moment from 'moment';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { connectApi } from '../api';
import { Suggester } from '../utils/suggester';
import { CarePlanNoteDisplay } from './CarePlanNoteDisplay';
import { CarePlanNoteForm } from './CarePlanNoteForm';

const Container = styled.div`
  min-height: 50vh;
`;

const NotesSection = styled.section`
  margin-top: 2rem;
`;

const EditableNoteFormContainer = styled.div`
  margin: 2rem 0;
`;

function EditableNoteDisplay({ onSuccessfulSubmit, updateNote, onNoteDeleted, ...rest }) {
  const [isEditing, setIsEditing] = useState(false);
  return isEditing ? (
    <EditableNoteFormContainer>
      <CarePlanNoteForm
        onSubmit={values => {
          updateNote({ ...rest.note, ...values });
        }}
        onSuccessfulSubmit={() => {
          setIsEditing(false);
          onSuccessfulSubmit();
        }}
        onCancel={() => {
          setIsEditing(false);
        }}
        {...rest}
      />
    </EditableNoteFormContainer>
  ) : (
    <CarePlanNoteDisplay onEditClicked={() => setIsEditing(true)} onNoteDeleted {...rest} />
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
              return moment(a.date).isBefore(b.date) ? 1 : -1;
            }),
          );
        }
      }
    });
  }, [props.item.id, reloadNotes]);

  return (
    <Container>
      <CarePlanNoteForm
        key={resetForm}
        onSubmit={values => props.submitNote(props.item.id, values)}
        onReloadNotes={() => {
          setReloadNotes(reloadNotes + 1);
        }}
        onSuccessfulSubmit={() => {
          setResetForm(resetForm + 1);
        }}
        practitionerSuggester={props.practitionerSuggester}
      />
      {firstNote ? (
        <NotesSection>
          <EditableNoteDisplay
            note={firstNote}
            isMainCarePlan
            onReloadNotes={() => {
              setReloadNotes(reloadNotes + 1);
            }}
            onSuccessfulSubmit={() => {
              setResetForm(resetForm + 1);
            }}
            practitionerSuggester={props.practitionerSuggester}
            updateNote={props.updateNote}
          />
          {subsequentNotes.length
            ? subsequentNotes.map((note, index) => (
                <EditableNoteDisplay
                  key={index}
                  note={note}
                  onNoteDeleted={() => {
                    setReloadNotes(reloadNotes + 1);
                  }}
                  onReloadNotes={() => {
                    setReloadNotes(reloadNotes + 1);
                  }}
                  onSuccessfulSubmit={() => {
                    setResetForm(resetForm + 1);
                  }}
                  practitionerSuggester={props.practitionerSuggester}
                  updateNote={props.updateNote}
                />
              ))
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
  deleteNote: async noteId => {
    return await api.delete(`note/${noteId}`);
  },
  updateNote: async note => {
    return await api.put(`note/${note.id}`, note);
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbPatientCarePlanDetails);
