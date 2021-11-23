import React, { useState } from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { Modal } from './Modal';
import { MedicationForm } from '../forms/MedicationForm';

export const MedicationModal = ({ open, onClose, onSaved, encounterId, medication, readOnly }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const drugSuggester = new Suggester(api, 'drug');
  const [shouldDiscontinue, shouldSetDiscontinue] = useState(readOnly ? false : null);
  const onDiscontinue = () => {
    shouldSetDiscontinue(true);
  };
  
  const onDiscontinueSubmit = async data => {
    const payload = {
      discontinuingClinician: data?.discontinuingClinician,
      discontinuingReason: data?.discontinuingReason,
      discontinued: !!data?.discontinuingClinician,
    };
    api.put(`medication/${medication.id}`, payload);

    shouldSetDiscontinue(false);
    onClose();

    if (onSaved) {
      onSaved();
    }
  };

  const onSaveSubmit = async data => {
    await api.post('medication', {
      ...data,
      encounterId,
    });
   
    if (onSaved) {
      onSaved();
    }
  };

  return (
    <Modal title={!readOnly ? "Prescribe medication" : 'Medication details'} open={open} onClose={onClose}>
      <MedicationForm
        onSubmit={readOnly ? onDiscontinueSubmit : onSaveSubmit}
        medication={medication}
        onCancel={() => {
          shouldSetDiscontinue(false);
          onClose();
        }}
        readOnly={readOnly}
        practitionerSuggester={practitionerSuggester}
        onDiscontinue={onDiscontinue}
        shouldDiscontinue={shouldDiscontinue}
        drugSuggester={drugSuggester}
      />
    </Modal>
  );
};
