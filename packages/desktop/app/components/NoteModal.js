import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';

export const NoteModal = ({
  title = 'Note',
  open,
  onClose,
  onSaved,
  encounterId,
  noteId,
  editedObject,
}) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  // Don't allow users to modify encounter notes
  // (currently this component only manages those)
  const isReadOnly = !!editedObject?.id;

  return (
    <Modal title={title} open={open} width="md" onClose={onClose}>
      <NoteForm
        onSubmit={async data => {
          // TODO: Add support for PUT
          const newData = { ...data };
          newData.recordId = encounterId;
          newData.recordType = 'Encounter';
          await api.post('notePages', newData);
          onSaved();
        }}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        editedObject={editedObject}
        isReadOnly={isReadOnly}
      />
    </Modal>
  );
};
