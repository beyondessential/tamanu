import React from 'react';
import Box from '@mui/material/Box';
import styled from 'styled-components';
import { NoteItem } from './NoteItem';

const StyledBox = styled(Box)`
  .MuiListItem-root {
    padding-bottom: 0;
  }
`;

export const NoteItemList = ({
  noteItems = [],
  currentUserId,
  onEditNoteItem,
  lastNoteItemRef,
}) => {
  if (!noteItems?.length) {
    return null;
  }

  return (
    <StyledBox
      sx={{ width: '100%', maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper' }}
      data-testid="styledbox-o2d6"
    >
      {noteItems.map((noteItem, index) => (
        <NoteItem
          key={noteItem.id}
          index={index}
          noteItem={noteItem}
          editable={currentUserId === noteItem.authorId}
          onEditNoteItem={onEditNoteItem}
          lastNoteItemRef={index === noteItems.length - 1 ? lastNoteItemRef : undefined}
          data-testid={`noteitem-wp2x-${index}`}
        />
      ))}
    </StyledBox>
  );
};
