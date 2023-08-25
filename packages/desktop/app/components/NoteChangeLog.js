import React from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import { DateDisplay } from './DateDisplay';
import { Colors } from '../constants';

const StyledDivider = styled(Divider)`
  margin-top: 10px;
`;

const StyledListItemText = styled(ListItemText)`
  .MuiListItemText-primary {
    font-size: 14px;
    line-height: 18px;
    white-space: pre-line;
    width: 100%;
  }
`;
const StyledNoteChangeLogInfoWrapper = styled.div`
  font-weight: 500;
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.softText};
  margin-top: 5px;
`;

const NoteChangeLogMain = ({ note }) => <span>{note.content} </span>;

const NoteChangeLogInfo = ({ note }) => (
  <StyledNoteChangeLogInfoWrapper>
    <>
      <span>{note.author?.displayName || ''} </span>
      {note.onBehalfOf ? <span>on behalf of {note.onBehalfOf.displayName} </span> : null}
      <DateDisplay date={note.date} showTime />
    </>
  </StyledNoteChangeLogInfoWrapper>
);

export const NoteChangeLog = ({ note }) => (
  <ListItem>
    <StyledListItemText
      primary={
        <>
          <NoteChangeLogInfo note={note} />
          <NoteChangeLogMain note={note} />
          <StyledDivider />
        </>
      }
    />
  </ListItem>
);
