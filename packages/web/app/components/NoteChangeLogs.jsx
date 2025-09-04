import React from 'react';
import Box from '@mui/material/Box';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '../constants';
import { useApi } from '../api';
import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import { NoteChangeLog } from './NoteChangeLog';
import { TranslatedText } from './Translation/TranslatedText';

const StyledBox = styled(Box)`
  .MuiListItem-root {
    padding-bottom: 0;
  }
  &.MuiBox-root {
    border-radius: 3px;
    border: 1px solid ${Colors.outline};
    padding-bottom: 16px;
  }
`;

export const NoteChangeLogs = ({ note = {} }) => {
  const api = useApi();

  const { data: { data: changeLogNotes } = {} } = useQuery(
    ['noteChangeLogs', note.recordId, note.revisedById],
    () => api.get(`encounter/${note.recordId}/notes/${note.revisedById}/changelogs`),
    { enabled: !!(note.recordId && note.revisedById) },
  );

  if (isEmpty(note) || !changeLogNotes?.length) {
    return null;
  }

  return (
    <OuterLabelFieldWrapper
      label={
        <TranslatedText
          stringId="note.changeLog.label"
          fallback="Change log"
          data-testid="translatedtext-llzr"
        />
      }
      data-testid="outerlabelfieldwrapper-pwpg"
    >
      <StyledBox
        sx={{ width: '100%', maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}
        data-testid="styledbox-vgh1"
      >
        {changeLogNotes.map((changeLogNote, index) => (
          <NoteChangeLog
            key={changeLogNote.id}
            note={changeLogNote}
            data-testid={`notechangelog-4wb2-${index}`}
          />
        ))}
      </StyledBox>
    </OuterLabelFieldWrapper>
  );
};
