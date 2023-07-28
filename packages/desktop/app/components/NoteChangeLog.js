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
  &.MuiListItemText-root {
    margin-bottom: 0;
  }
`;
const StyledNoteChangeLogSecondaryWrapper = styled.div`
  font-weight: 500;
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.softText};
  margin-top: 5px;
`;

const NoteChangeLogMain = ({ note }) => <span>{note.content} </span>;

const NoteChangeLogSecondary = ({ note }) => (
  <StyledNoteChangeLogSecondaryWrapper>
    <>
      <span>{note.author?.displayName || ''} </span>
      {note.onBehalfOf ? <span>on behalf of {note.onBehalfOf.displayName} </span> : null}
      <DateDisplay date={note.date} showTime />
    </>
  </StyledNoteChangeLogSecondaryWrapper>
);

export const NoteChangeLog = ({ note }) => (
  <ListItem>
    <StyledListItemText
      primary={
        <>
          <NoteChangeLogMain note={note} />
          <NoteChangeLogSecondary note={note} />
        </>
      }
    />
  </ListItem>
);
