import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';

export const NoteModal = ({ open, onClose, onSaved, encounterId, noteId, editedObject }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  // Don't allow users to modify encounter notes
  // (currently this component only manages those)
  const isReadOnly = !!editedObject?.id;

  return (
    <Modal title="Note" open={open} onClose={onClose}>
      <NoteForm
        onSubmit={async data => {
          if (noteId || data.id) {
            await api.put(`note/${noteId || data.id}`, data);
          } else {
            await api.post(`encounter/${encounterId}/notes`, data);
          }
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
