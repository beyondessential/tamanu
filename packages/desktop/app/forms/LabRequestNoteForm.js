import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { NOTE_TYPES, LAB_REQUEST_STATUSES } from 'shared/constants';
import { useApi } from '../api';
import { Form, Field, TextField, AddButton, TextInput } from '../components';

const Container = styled.div`
  grid-column: 1 / -1;
`;

const FlexRow = styled.div`
  display: flex;
`;

const NotesInput = styled(Field)`
  flex: 1;
  margin-right: 12px;
`;

const AddNoteButton = styled(AddButton)`
  height: 43px;
  align-self: flex-end;
`;

const ReadOnlyField = ({ notes }) => {
  const notesText = notes.map(note => note.content).join(', ');
  return (
    <TextInput
      multiline
      value={notesText}
      label="Notes"
      style={{ gridColumn: '1 / -1', minHeight: '60px' }}
      disabled
    />
  );
};

export const LabRequestNoteForm = React.memo(({ labRequest }) => {
  const api = useApi();
  const [notes, setNotes] = useState([]);
  const isReadOnly = labRequest.status === LAB_REQUEST_STATUSES.CANCELLED;

  useEffect(() => {
    (async () => {
      const res = await api.get(`labRequest/${labRequest.id}/notes`);
      setNotes(res.data);
    })();
  }, [api, labRequest.id]);

  const saveNote = async ({ content }, { resetForm }) => {
    const newNote = await api.post(`labRequest/${labRequest.id}/notes`, {
      content,
      authorId: api.user.id,
      noteType: NOTE_TYPES.OTHER,
    });
    setNotes([...notes, newNote]);
    resetForm();
  };

  if (isReadOnly) {
    return <ReadOnlyField notes={notes} />;
  }

  return (
    <Container>
      <Form
        onSubmit={saveNote}
        render={({ submitForm }) => (
          <FlexRow>
            <NotesInput label="Note" name="content" component={TextField} />
            <AddNoteButton onClick={submitForm} />
          </FlexRow>
        )}
        initialValues={{}}
        validationSchema={yup.object().shape({
          content: yup.string().required(),
        })}
      />
      <ul>
        {notes.map(note => (
          <li key={`${note.id}`}>{note.content}</li>
        ))}
      </ul>
    </Container>
  );
});
