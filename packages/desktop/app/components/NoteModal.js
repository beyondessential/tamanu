import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewEncounter } from '../store/encounter';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';

const DumbNoteModal = React.memo(({ open, onClose, onSaveNote, practitionerSuggester }) => (
  <Modal title="Note" open={open} onClose={onClose}>
    <NoteForm
      onSubmit={onSaveNote}
      onCancel={onClose}
      practitionerSuggester={practitionerSuggester}
    />
  </Modal>
));

export const NoteModal = connectApi((api, dispatch, { encounterId, onClose }) => ({
  onSaveNote: async data => {
    if (data.id) {
      await api.put(`note/${data.id}`, data);
    } else {
      await api.post(`encounter/${encounterId}/notes`, data);
    }

    onClose();
    dispatch(viewEncounter(encounterId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbNoteModal);
