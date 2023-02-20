import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import NotesIcon from '@material-ui/icons/Notes';
import { Button } from '@material-ui/core';
import { NOTE_TYPES } from 'shared/constants';
import { useApi } from '../api';
import { Form, Field, TextField } from '../components';

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 3px;
  margin-bottom: 15px;
  padding: 12px;
`;

const NotesSection = styled.div`
  flex: 1;
`;

const List = styled.ul`
  margin: 0;
  padding: 4px 0 0 15px;
  min-height: 25px;
`;

const ListItem = styled.li`
  margin: 0 0 5px 0;
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

const NotesInput = styled(Field)`
  flex: 1;

  .MuiInputBase-input {
    font-size: 11px;
    line-height: 15px;
    padding: 8px;
  }
`;

const TextButton = styled(Button)`
  font-weight: 500;
  font-size: 11px;
  line-height: 15px;
  text-transform: none;
  padding-left: 8px;
  padding-right: 8px;
  min-width: auto;
  color: ${props => props.theme.palette.text.tertiary};
  background: none;

  &.MuiButton-root:hover {
    background: none;
    text-decoration: underline;
    color: ${props => props.theme.palette.primary.main};
  }
`;

export const LabRequestNoteForm = React.memo(({ labRequest, isReadOnly }) => {
  const api = useApi();
  const [active, setActive] = useState(false);
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
    setActive(false);
    resetForm();
  };

  return (
    <Container>
      <NotesIcon style={{ marginRight: 5 }} />
      <NotesSection>
        <List>
          {notes.map(note => (
            <ListItem key={`${note.id}`}>{note.content}</ListItem>
          ))}
        </List>
        <Form
          onSubmit={saveNote}
          render={({ submitForm, values }) => {
            return active ? (
              <Wrapper>
                <NotesInput label="" name="content" component={TextField} />
                <TextButton onClick={submitForm} disabled={!values.content}>
                  Save
                </TextButton>
                <TextButton onClick={() => setActive(false)}>Cancel</TextButton>
              </Wrapper>
            ) : (
              <TextButton onClick={() => setActive(true)}>Add note</TextButton>
            );
          }}
        />
      </NotesSection>
    </Container>
  );
});
