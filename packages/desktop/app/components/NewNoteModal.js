import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';
import { useAuth } from '../contexts/Auth';

export const NewNoteModal = ({ title = 'Note', open, onClose, onSaved, encounterId }) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const practitionerSuggester = new Suggester(api, 'practitioner');

  return (
    <Modal title={title} open={open} width="md" onClose={onClose}>
      <NoteForm
        onSubmit={async data => {
          const newData = { ...data };
          newData.authorId = currentUser.id;
          newData.recordId = encounterId;
          newData.recordType = 'Encounter';
          await api.post('notePages', newData);
          onSaved();
        }}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  );
};
