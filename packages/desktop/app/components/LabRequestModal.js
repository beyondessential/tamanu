import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import { customAlphabet } from 'nanoid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';

import { connectApi } from '../api/connectApi';

import { ConnectedLabRequestForm } from '../forms/LabRequestForm';

const ALPHABET_FOR_ID = 'ABCDEFGH' + /*I*/ 'JK' + /*L*/ 'MN' + /*O*/ 'PQRSTUVWXYZ' + /*01*/ '23456789';

const DumbLabRequestModal = React.memo(
  ({ open, encounter, practitionerSuggester, onClose, onSubmit }) => {
    const { loadEncounter } = useEncounter();
    const submitLabRequest = useCallback(async data => {
      await onSubmit(data);
      await loadEncounter(encounter.id);
      onClose();
    }, []);

    return (
      <Modal width="md" title="New lab request" open={open} onClose={onClose}>
        <ConnectedLabRequestForm
          onSubmit={submitLabRequest}
          onCancel={onClose}
          encounter={encounter}
          practitionerSuggester={practitionerSuggester}
          generateId={() => customAlphabet(ALPHABET_FOR_ID, 6)}
        />
      </Modal>
    );
  },
);

export const LabRequestModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    await api.post(`labRequest`, {
      ...data,
      encounterId: encounter.id,
    });
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbLabRequestModal);
