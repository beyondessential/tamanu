import React from 'react';

import { FormSubmitCancelRow } from '../components/ButtonRow';
import {
  NoteContentField,
  NoteDateTimeField,
  NoteTypeField,
  StyledDivider,
  StyledFormGrid,
  WrittenByField,
} from '../components/NoteCommonFields';

export const CreateNoteForm = ({
  onNoteContentChange,
  onSubmit,
  onCancel,
  noteTypeCountByType,
}) => (
  <>
    <StyledFormGrid columns={3}>
      <NoteTypeField required noteTypeCountByType={noteTypeCountByType} />
      <WrittenByField required />
      <NoteDateTimeField required />
    </StyledFormGrid>
    <NoteContentField label="Add note" onChange={onNoteContentChange} />
    <StyledDivider />
    <FormSubmitCancelRow
      onConfirm={onSubmit}
      confirmText="Add note"
      cancelText="Cancel"
      onCancel={onCancel}
    />
  </>
);
