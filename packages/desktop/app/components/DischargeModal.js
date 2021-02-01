import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';

import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';

const DumbDischargeModal = React.memo(({ open, practitionerSuggester, onClose, onSubmit }) => {
  const { setEncounterData, encounter } = useEncounter();
  const handleDischarge = useCallback(
    data => {
      setEncounterData({ ...encounter, endDate: new Date().toString() });
      onSubmit(data);
    },
    [encounter],
  );

  return (
    <Modal title="Discharge" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={handleDischarge}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  );
});

export const DischargeModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    await api.put(`encounter/${encounter.id}`, data);
    dispatch(push('/patients/encounter/'));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDischargeModal);
