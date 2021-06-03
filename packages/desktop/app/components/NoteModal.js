import React, { useCallback } from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';
import { useEncounter } from '../contexts/Encounter';

const DumbNoteModal = React.memo(
  ({ open, onClose, onSaveNote, practitionerSuggester, encounterId, editedObject }) => {
    const { loadEncounter } = useEncounter();

    const saveNote = useCallback(async data => {
      await onSaveNote(data);
      await loadEncounter(encounterId);
      onClose();
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
  },
);

export const NoteModal = connectApi((api, dispatch, { encounterId, noteId: existingNoteId }) => ({
  onSaveNote: async data => {
    const noteId = existingNoteId || data.id;
    if (noteId) {
      await api.put(`note/${noteId}`, data);
    } else {
      await api.post(`encounter/${encounterId}/notes`, data);
    }
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbNoteModal);
