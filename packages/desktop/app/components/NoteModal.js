import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';
import { useAuth } from '../contexts/Auth';

export const NoteModal = ({ open, onClose, onSaved, encounterId, noteId, editedObject }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const { currentUser } = useAuth();
  // Only allow users to modify notes created by themselves
  const isReadOnly = !!editedObject?.authorId && currentUser.id !== editedObject.authorId;

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
