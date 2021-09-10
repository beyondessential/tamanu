import React, { useCallback } from 'react';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';

import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';

const DumbDischargeModal = React.memo(({ open, practitionerSuggester, onClose }) => {
  const { writeAndViewEncounter, encounter } = useEncounter();
  const handleDischarge = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      onClose();
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

export const DischargeModal = connectApi(api => ({
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDischargeModal);
