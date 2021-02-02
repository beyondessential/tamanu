import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';
import { useEncounter } from '../contexts/Encounter';

const DumbNoteModal = React.memo(({ open, onClose, onSaveNote, practitionerSuggester }) => {
  const { fetchData } = useEncounter();

  const saveNote = useCallback(data => {
    onSaveNote(data);
    fetchData();
  }, []);

  return (
    <Modal title="Note" open={open} onClose={onClose}>
      <NoteForm
        onSubmit={saveNote}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  );
});

export const NoteModal = connectApi((api, dispatch, { encounterId, onClose }) => ({
  onSaveNote: async data => {
    if (data.id) {
      await api.put(`note/${data.id}`, data);
    } else {
      await api.post(`encounter/${encounterId}/notes`, data);
    }

    onClose();
    dispatch(push(`/patients/encounter/`));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbNoteModal);
