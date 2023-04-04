import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import * as yup from 'yup';
import { NOTE_TYPES } from 'shared/constants';
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

const ReadOnlyNotesField = ({ notes }) => {
  const notesText = notes.map(note => note.content).join('. ');
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

export const LabRequestNoteForm = React.memo(({ labRequest, isReadOnly }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState([]);

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
    queryClient.invalidateQueries(['labRequestNotes']);
  };

  if (isReadOnly) {
    return <ReadOnlyNotesField notes={notes} />;
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
