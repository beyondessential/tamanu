import React from 'react';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { useApi } from '../api';
import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import { NoteChangeLog } from './NoteChangeLog';

const StyledBox = styled(Box)`
  .MuiListItem-root {
    padding-bottom: 0;
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
