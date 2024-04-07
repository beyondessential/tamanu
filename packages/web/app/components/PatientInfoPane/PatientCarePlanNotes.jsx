import React, { useEffect, useState } from 'react';
import { isBefore } from 'date-fns';
import styled from 'styled-components';
import { useApi } from '../../api';
import { CarePlanNoteDisplay } from '../CarePlanNoteDisplay';
import { CarePlanNoteForm } from '../CarePlanNoteForm';

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

export const PatientCarePlanDetails = React.memo(({ item }) => {
  const [firstNote, setFirstNote] = useState();
  const [subsequentNotes, setSubsequentNotes] = useState([]);
  const [resetForm, setResetForm] = useState(0);
  const [reloadNotes, setReloadNotes] = useState(0);
  const api = useApi();

  useEffect(() => {
    api.get(`patientCarePlan/${item.id}/notes`).then(notes => {
      if (notes.length) {
        // first note is the main care plan
        setFirstNote(notes[0]);

        if (notes.length > 1) {
          // display the latest note first
          setSubsequentNotes(
            notes.slice(1).sort((a, b) => (isBefore(new Date(a.date), new Date(b.date)) ? 1 : -1)),
          );
        } else {
          setSubsequentNotes([]);
        }
      }
    });
  }, [api, item.id, reloadNotes]);

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
});
