import React from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { NoteItem } from './NoteItem';

const StyledBox = styled(Box)`
`;

export const NoteItemList = ({ noteItems = [], currentUserId, onSaveItem }) => {
  if (!noteItems?.length) {
    return null;
  }

  return (
    <StyledBox
      sx={{ width: '100%', maxHeight: 300, overflowY: 'scroll', bgcolor: 'background.paper' }}
    >
      {noteItems.map(noteItem => (
        <NoteItem
          noteItem={noteItem}
          editable={currentUserId === noteItem.authorId}
          onSaveItem={onSaveItem}
        />
      ))}
    </StyledBox>
  );
};
