import React from 'react';
import { customAlphabet } from 'nanoid';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { ConnectedLabRequestForm } from '../forms/LabRequestForm';
import { ALPHABET_FOR_ID } from '../constants'

export const LabRequestModal = ({ open, onClose, onSaved, encounter }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');

  return (
    <Modal width="md" title="New lab request" open={open} onClose={onClose}>
      <ConnectedLabRequestForm
        onSubmit={async data => {
          await api.post(`labRequest`, {
            ...data,
            encounterId: encounter.id,
          });
          onSaved();
        }}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        generateDisplayId={customAlphabet(ALPHABET_FOR_ID, 7)}
      />
    </Modal>
  );
};
