import React from 'react';
import Box from '@material-ui/core/Box';
import { NoteItem } from './NoteItem';

export const NoteItemList = ({ noteItems = [], currentUserId, onEditNoteItem }) => {
  if (!noteItems?.length) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', maxHeight: 300, overflowY: 'scroll', bgcolor: 'background.paper' }}>
      {noteItems.map(noteItem => (
        <NoteItem
          key={noteItem.id}
          noteItem={noteItem}
          editable={currentUserId === noteItem.authorId}
          onEditNoteItem={onEditNoteItem}
        />
      ))}
    </Box>
  );
};
