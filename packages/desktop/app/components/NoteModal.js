import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewVisit } from '../store/visit';

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

export const NoteModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSaveNote: async data => {
    if (data.id) {
      await api.put(`note/${data.id}`, data);
    } else {
      await api.post(`visit/${visitId}/notes`, data);
    }

    onClose();
    dispatch(viewVisit(visitId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbNoteModal);
