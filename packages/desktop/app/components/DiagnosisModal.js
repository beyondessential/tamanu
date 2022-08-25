import React, { useCallback } from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';
import { showDecisionSupport } from '../store/specialModals';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(
  ({ diagnosis, onClose, onSaveDiagnosis, encounterId, ...rest }) => {
    const { loadEncounter } = useEncounter();
    const saveDiagnosis = useCallback(
      async data => {
        await onSaveDiagnosis(data);
        await loadEncounter(encounterId);
        onClose();
      },
      [onSaveDiagnosis, loadEncounter, onClose, encounterId],
    );

    return (
      <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
        <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={saveDiagnosis} {...rest} />
      </Modal>
    );
  },
);

export const DiagnosisModal = connectApi((api, dispatch, { encounterId, excludeDiagnoses }) => ({
  onSaveDiagnosis: async data => {
    if (data.id) {
      await api.put(`diagnosis/${data.id}`, data);
    } else {
      const { diagnosis, previousDiagnoses = [] } = await api.post(`diagnosis`, {
        ...data,
        encounterId,
      });
      if (previousDiagnoses.length > 0) {
        dispatch(
          showDecisionSupport('repeatDiagnosis', {
            diagnosis,
            previousDiagnoses,
          }),
        );
      }
    }
  },
  icd10Suggester: new Suggester(api, 'icd10', {
    filterer: icd => !excludeDiagnoses.some(d => d.diagnosisId === icd.id),
  }),
}))(DumbDiagnosisModal);
