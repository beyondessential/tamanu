import React from 'react';
import { useEncounter } from '../contexts/Encounter';
import { DiagnosisForm } from '../forms/DiagnosisForm';
import { useApi } from '../api';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DiagnosisModal = React.memo(({ diagnosis, onClose, encounterId, ...props }) => {
  const api = useApi();
  const { loadEncounter } = useEncounter();
  const onSaveDiagnosis = async (data) => {
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
    <FormModal
      title={
        <TranslatedText
          stringId="diagnosis.modal.title"
          fallback="Diagnosis"
          data-testid="translatedtext-o76o"
        />
      }
      open={!!diagnosis}
      onClose={onClose}
      data-testid="formmodal-kov5"
    >
      <DiagnosisForm
        onCancel={onClose}
        diagnosis={diagnosis}
        onSave={onSaveDiagnosis}
        {...props}
        data-testid="diagnosisform-1rdr"
      />
    </FormModal>
  );
});
