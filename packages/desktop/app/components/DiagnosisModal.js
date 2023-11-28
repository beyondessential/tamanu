import React from 'react';
import { useEncounter } from '../contexts/Encounter';
import { DiagnosisForm } from '../forms/DiagnosisForm';
import { useApi } from '../api';
import { FormModal } from './FormModal';

export const DiagnosisModal = React.memo(({ diagnosis, onClose, encounterId, ...props }) => {
  const api = useApi();
  const { loadEncounter } = useEncounter();
  const onSaveDiagnosis = async data => {
    if (data.id) {
      await api.put(`diagnosis/${data.id}`, data);
    } else {
      await api.post(`diagnosis`, {
        ...data,
        encounterId,
      });
    }
    await loadEncounter(encounterId);
    onClose();
  };

  return (
    <FormModal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
      <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={onSaveDiagnosis} {...props} />
    </FormModal>
  );
});
