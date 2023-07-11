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
const StyledNoteChangelogSecondaryWrapper = styled.div`
  font-size: 11px;
  line-height: 18px;
  color: ${Colors.softText};
  margin-top: 5px;
`;

const NoteChangelogMain = ({ note }) => <span>{note.content} </span>;

const NoteChangelogSecondary = ({ note }) => (
  <StyledNoteChangelogSecondaryWrapper>
    <>
      <span>{note.author?.displayName || ''} </span>
      {note.onBehalfOf ? <span>on behalf of {note.onBehalfOf.displayName} </span> : null}
      <DateDisplay date={note.date} showTime />
    </>
  </StyledNoteChangelogSecondaryWrapper>
);

export const NoteChangelog = ({ note }) => (
  <ListItem>
    <StyledListItemText
      primary={
        <>
          <NoteChangelogMain note={note} />
          <NoteChangelogSecondary note={note} />
        </>
      }
    />
  </ListItem>
);
