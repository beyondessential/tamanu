import moment from 'moment';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { connectApi } from '../api';
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

function EditableNoteDisplay({ onSuccessfulSubmit, onNoteDeleted, ...rest }) {
  const [isEditing, setIsEditing] = useState(false);
  return isEditing ? (
    <EditableNoteFormContainer>
      <CarePlanNoteForm
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
    <CarePlanNoteDisplay
      onEditClicked={() => setIsEditing(true)}
      onNoteDeleted={onNoteDeleted}
      {...rest}
    />
  );
}

function DumbPatientCarePlanDetails({ getNotes, item }) {
  const [firstNote, setFirstNote] = useState();
  const [subsequentNotes, setSubsequentNotes] = useState([]);
  const [resetForm, setResetForm] = useState(0);
  const [reloadNotes, setReloadNotes] = useState(0);

  useEffect(() => {
    getNotes(item.id).then(notes => {
      if (notes.length) {
        // first note is the main care plan
        setFirstNote(notes[0]);

        if (notes.length > 1) {
          // display the latest note first
          setSubsequentNotes(
            notes.slice(1).sort((a, b) => (moment(a.date).isBefore(b.date) ? 1 : -1)),
          );
        }
      }
    });
  }, [item.id, getNotes, reloadNotes]);

  return (
    <Container>
      <CarePlanNoteForm
        key={resetForm}
        carePlanId={item.id}
        onReloadNotes={() => {
          setReloadNotes(reloadNotes + 1);
        }}
        onSuccessfulSubmit={() => {
          setResetForm(resetForm + 1);
        }}
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
          />
          {subsequentNotes.length
            ? subsequentNotes.map(note => (
                <EditableNoteDisplay
                  key={note.id}
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
                />
              ))
            : null}
        </NotesSection>
      ) : null}
    </Container>
  );
}

export const PatientCarePlanDetails = connectApi(api => ({
  getNotes: async patientCarePlanId => api.get(`patientCarePlan/${patientCarePlanId}/notes`),
}))(DumbPatientCarePlanDetails);
