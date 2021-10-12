import React, { useCallback } from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';

export const NoteModal = ({ open, onClose, onSaved, encounterId, noteId, editedObject }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');

  const saveNote = useCallback(async data => {
    if (noteId || data.id) {
      await api.put(`note/${noteId || data.id}`, data);
    } else {
      await api.post(`encounter/${encounterId}/notes`, data);
    }
    onSaved();
  }, []);

  return (
    <Modal title="Note" open={open} onClose={onClose}>
      <NoteForm
        onSubmit={saveNote}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        editedObject={editedObject}
      />
    </Modal>
  );
};
