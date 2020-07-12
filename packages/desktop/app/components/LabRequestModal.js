import React from 'react';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { ConnectedLabRequestForm } from '../forms/LabRequestForm';

const DumbLabRequestModal = React.memo(
  ({ open, encounter, practitionerSuggester, onClose, onSubmit }) => (
    <Modal width="md" title="New lab request" open={open} onClose={onClose}>
      <ConnectedLabRequestForm
        onSubmit={onSubmit}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        generateId={shortid.generate}
      />
    </Modal>
  ),
);

export const LabRequestModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    const encounterId = encounter.id;
    await api.post(`labRequest`, {
      ...data,
      encounterId,
    });
    dispatch(viewEncounter(encounterId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbLabRequestModal);
