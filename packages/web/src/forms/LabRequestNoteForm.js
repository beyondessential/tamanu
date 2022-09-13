import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { NOTE_TYPES } from 'shared/constants';

import { useApi } from '../api';
import { AddButton } from '../components';
import { Form, Field, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';

const NotesForm = styled.div`
  grid-column: 1 / -1;
`;

const NotesDisplay = styled.ul`
  grid-column: 1 / -1;
`;

const StyledFormGrid = styled(FormGrid)`
  width: 100%;
  display: flex;
`;

const NotesInput = styled(Field)`
  width: 100%;
  margin-right: 12px;
`;

const AddNoteButton = styled(AddButton)`
  height: 43px;
  align-self: flex-end;
`;

export const LabRequestNoteForm = ({ labRequest, refreshLabRequest }) => {
  const api = useApi();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await api.get(`labRequest/${labRequest.id}/notes`);
      setNotes(res.data);
    })();
  }, [api, labRequest.id]);

  const saveNote = useCallback(
    async ({ content }) => {
      const newNote = await api.post(`labRequest/${labRequest.id}/notes`, {
        content,
        authorId: api.user.id,
        noteType: NOTE_TYPES.OTHER,
      });
      setNotes([newNote, ...notes]);
      refreshLabRequest();
    },
    [notes, labRequest.id, api, refreshLabRequest],
  );

  const renderForm = useCallback(
    ({ submitForm }) => (
      <StyledFormGrid columns={1}>
        <NotesInput label="Note" name="content" component={TextField} />
        <AddNoteButton onClick={submitForm} />
      </StyledFormGrid>
    ),
    [],
  );

  return (
    <NotesForm>
      <Form
        onSubmit={saveNote}
        render={renderForm}
        initialValues={{}}
        validationSchema={yup.object().shape({
          content: yup.string().required(),
        })}
      />
      <NotesDisplay>
        {notes.map(note => (
          <li key={`${note.id}`}>{note.content}</li>
        ))}
      </NotesDisplay>
    </NotesForm>
  );
};
