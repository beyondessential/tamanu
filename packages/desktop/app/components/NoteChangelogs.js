import React from 'react';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';

import { NoteChangelog } from './NoteChangelog';

const StyledBox = styled(Box)`
  .MuiListItem-root {
    padding-bottom: 0;
  }
`;

export const NoteChangelogs = ({ notes = [] }) => {
  if (!notes?.length) {
    return null;
  }

  return (
    <StyledBox
      sx={{ width: '100%', maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}
    >
      {notes.map(note => (
        <NoteChangelog key={note.id} note={note} />
      ))}
    </StyledBox>
  );
};
