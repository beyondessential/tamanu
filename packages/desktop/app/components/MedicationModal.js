import React, { useState } from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { Modal } from './Modal';
import { MedicationForm } from '../forms/MedicationForm';

export const MedicationModal = ({ open, onClose, onSaved, encounterId, medication, readOnly }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const drugSuggester = new Suggester(api, 'drug');
  const [shouldDiscontinue, setShouldDiscontinue] = useState(false);
  const onDiscontinue = () => {
    setShouldDiscontinue(true);
  };
  
  const onDiscontinueSubmit = async data => {
    const payload = {
      discontinuingClinicianId: data?.discontinuingClinicianId,
      discontinuingReason: data?.discontinuingReason,
      discontinued: !!data?.discontinuingClinicianId,
    };
    api.put(`medication/${medication.id}`, payload);

    setShouldDiscontinue(false);
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
          setShouldDiscontinue(false);
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
