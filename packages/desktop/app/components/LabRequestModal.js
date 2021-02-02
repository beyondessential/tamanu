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
    const { fetchData } = useEncounter();
    const submitLabRequest = useCallback(data => {
      onSubmit(data);
      fetchData();
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
    const encounterId = encounter.id;
    await api.post(`labRequest`, {
      ...data,
      encounterId,
    });
    dispatch(push(`/patients/encounter/`));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbLabRequestModal);
