import React from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import { DateDisplay } from './DateDisplay';
import { Colors } from '../constants';

const StyledListItemText = styled(ListItemText)`
  .MuiListItemText-primary {
    font-size: 14px;
    line-height: 18px;
    white-space: pre-line;
    width: 100%;
  }
`;
const StyledNoteItemSecondaryWrapper = styled.div`
  font-size: 11px;
  line-height: 18px;
  color: ${Colors.softText};
  margin-top: 5px;
`;

const NoteItemMain = ({ note }) => <span>{note.content} </span>;

const NoteItemSecondary = ({ note }) => (
  <StyledNoteItemSecondaryWrapper>
    <>
      <span>{note.author?.displayName || ''} </span>
      {note.onBehalfOf ? <span>on behalf of {note.onBehalfOf.displayName} </span> : null}
      <DateDisplay date={note.date} showTime />
    </>
  </StyledNoteItemSecondaryWrapper>
);

export const NoteChangelog = ({ note }) => (
  <ListItem>
    <StyledListItemText
      primary={
        <>
          <NoteItemMain note={note} />
          <NoteItemSecondary note={note} />
        </>
      }
    />
  </ListItem>
);
