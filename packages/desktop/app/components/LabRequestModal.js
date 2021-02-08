import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';

import { connectApi } from '../api/connectApi';

import { ConnectedLabRequestForm } from '../forms/LabRequestForm';

const DumbLabRequestModal = React.memo(
  ({ open, encounter, practitionerSuggester, onClose, onSubmit }) => {
    const { fetchAndSetEncounterData } = useEncounter();
    const submitLabRequest = useCallback(async data => {
      await onSubmit(data);
      await fetchAndSetEncounterData(encounter.id);
      onClose();
    }, []);

    return (
      <Modal width="md" title="New lab request" open={open} onClose={onClose}>
        <ConnectedLabRequestForm
          onSubmit={submitLabRequest}
          onCancel={onClose}
          encounter={encounter}
          practitionerSuggester={practitionerSuggester}
          generateId={shortid.generate}
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
