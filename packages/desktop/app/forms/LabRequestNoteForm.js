import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import NotesIcon from '@material-ui/icons/Notes';
import { Button, Box } from '@material-ui/core';
import { NOTE_TYPES } from 'shared/constants';
import { useApi } from '../api';
import { Form, Field, TextField, DateDisplay } from '../components';

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 3px;
  margin-bottom: 15px;
  padding: 12px;
`;

const List = styled.ul`
  margin: 0;
  padding: 4px 0 0 15px;
  min-height: 25px;
`;

const ListItem = styled.li`
  margin: 0 0 5px 0;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
`;

const Caption = styled.span`
  color: ${props => props.theme.palette.text.tertiary};
  margin-left: 6px;
`;

const NotesInput = styled(Field)`
  flex: 1;

  .MuiInputBase-input {
    font-size: 12px;
    line-height: 15px;
    padding: 8px;
  }
`;

const TextButton = styled(Button)`
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  text-transform: none;
  padding-left: 8px;
  padding-right: 8px;
  min-width: auto;
  background: none;
  color: ${props =>
    props.$underline ? props.theme.palette.primary.main : props.theme.palette.text.tertiary};
  text-decoration: ${props => (props.$underline ? 'underline' : 'none')};

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
      <NotesIcon color="primary" />
      <Box flex="1" ml={1}>
        <List>
          {notes.map(note => (
            <ListItem key={`${note.id}`}>
              {note.content}
              <Caption>
                {note.author?.displayName} <DateDisplay date={note.date} />
              </Caption>
            </ListItem>
          ))}
        </List>
        {!isReadOnly && (
          <Form
            onSubmit={saveNote}
            render={({ submitForm, values }) => {
              const formSubmitIsDisabled = !values.content || values.content.length < 2;
              return active ? (
                <Box display="flex" alignItems="center">
                  <NotesInput label="" name="content" component={TextField} />
                  <TextButton onClick={submitForm} disabled={formSubmitIsDisabled}>
                    Save
                  </TextButton>
                  <TextButton onClick={() => setActive(false)}>Cancel</TextButton>
                </Box>
              ) : (
                <TextButton $underline onClick={() => setActive(true)}>
                  Add note
                </TextButton>
              );
            }}
          />
        )}
      </Box>
    </Container>
  );
});
