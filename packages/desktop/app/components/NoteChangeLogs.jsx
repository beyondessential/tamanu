import Box from '@material-ui/core/Box';
import { useQuery } from '@tanstack/react-query';
import { isEmpty } from 'lodash';
import React from 'react';
import styled from 'styled-components';

import { useApi } from '../api';
import { Colors } from '../constants';
import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import { NoteChangeLog } from './NoteChangeLog';

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
    <OuterLabelFieldWrapper label="Change log">
      <StyledBox
        sx={{ width: '100%', maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}
      >
        {changeLogNotes.map(changeLogNote => (
          <NoteChangeLog key={changeLogNote.id} note={changeLogNote} />
        ))}
      </StyledBox>
    </OuterLabelFieldWrapper>
  );
};
