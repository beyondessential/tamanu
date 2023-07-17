import React from 'react';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { useApi } from '../api';
import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import { NoteChangelog } from './NoteChangelog';

const StyledBox = styled(Box)`
  .MuiListItem-root {
    padding-bottom: 0;
  }
`;

export const NoteChangelogs = ({ note = {} }) => {
  const api = useApi();

  const { data: { data: changelogNotes } = {} } = useQuery(
    ['noteChangelogs', note.recordId, note.revisedById],
    () => api.get(`encounter/${note.recordId}/notes/${note.revisedById}/changelogs`),
    { enabled: !!(note.recordId && note.revisedById) },
  );

  if (isEmpty(note) || !changelogNotes?.length) {
    return null;
  }

  return (
    <OuterLabelFieldWrapper label="Change log">
      <StyledBox
        sx={{ width: '100%', maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}
      >
        {changelogNotes.map(changelogNote => (
          <NoteChangelog key={changelogNote.id} note={changelogNote} />
        ))}
      </StyledBox>
    </OuterLabelFieldWrapper>
  );
};
