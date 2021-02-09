import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';
import { showDecisionSupport } from '../store/decisionSupport';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(
  ({ diagnosis, onClose, onSaveDiagnosis, encounterId, ...rest }) => {
    const { loadEncounter } = useEncounter();
    const saveDiagnosis = useCallback(async data => {
      await onSaveDiagnosis(data);
      await loadEncounter(encounterId);
      onClose();
    }, []);

    return (
      <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
        <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={saveDiagnosis} {...rest} />
      </Modal>
    );
  },
);

export const DiagnosisModal = connectApi((api, dispatch, { encounterId }) => ({
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
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);
