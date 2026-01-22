import React from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import { DateDisplay } from './DateDisplay';
import { Colors } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';

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
  <StyledNoteChangeLogInfoWrapper data-testid="stylednotechangeloginfowrapper-zbh3">
    <>
      <span>{note.author?.displayName || ''} </span>
      {note.onBehalfOf ? (
        <span>
          <TranslatedText
            stringId="note.table.onBehalfOfText"
            fallback="on behalf of :changeOnBehalfOfName"
            replacements={{ changeOnBehalfOfName: note.onBehalfOf.displayName }}
            data-testid="translatedtext-89o7"
          />{' '}
        </span>
      ) : null}
      <DateDisplay date={note.date} timeFormat="default" data-testid="datedisplay-o9yj" />
    </>
  </StyledNoteChangeLogInfoWrapper>
);

export const NoteChangeLog = ({ note }) => (
  <ListItem data-testid="listitem-bgup">
    <StyledListItemText
      primary={
        <>
          <NoteChangeLogInfo note={note} data-testid="notechangeloginfo-wopx" />
          <NoteChangeLogMain note={note} data-testid="notechangelogmain-eq78" />
          <StyledDivider data-testid="styleddivider-0nzu" />
        </>
      }
      data-testid="styledlistitemtext-jvqh"
    />
  </ListItem>
);
