import React from 'react';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { NoteItem } from './NoteItem';

const StyledBox = styled(Box)`
  .MuiListItem-root {
    padding-bottom: 0;
  }
`;

export const NoteItemList = ({ noteItems = [], currentUserId, onEditNoteItem }) => {
  if (!noteItems?.length) {
    return null;
  }

  return (
    <StyledBox
      sx={{ width: '100%', maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}
    >
      {noteItems.map(noteItem => (
        <NoteItem
          key={noteItem.id}
          noteItem={noteItem}
          editable={currentUserId === noteItem.authorId}
          onEditNoteItem={onEditNoteItem}
        />
      ))}
    </StyledBox>
  );
};
