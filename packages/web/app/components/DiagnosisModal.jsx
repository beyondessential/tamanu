import React from 'react';
import { useInvalidateEncounter } from '../api/queries/useEncounterQuery';
import { DiagnosisForm } from '../forms/DiagnosisForm';
import { useApi } from '../api';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DiagnosisModal = React.memo(({ diagnosis, onClose, encounterId, ...props }) => {
  const api = useApi();
  const invalidateEncounter = useInvalidateEncounter();
  const onSaveDiagnosis = async (data) => {
    if (data.id) {
      await api.put(`diagnosis/${data.id}`, data);
    } else {
      await api.post(`diagnosis`, {
        ...data,
        encounterId,
      });
    }
    await invalidateEncounter(encounterId);
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
