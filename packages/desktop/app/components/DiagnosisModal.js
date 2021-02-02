import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';
import { showDecisionSupport } from '../store/decisionSupport';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(({ diagnosis, onClose, onSaveDiagnosis, ...rest }) => {
  const { fetchData } = useEncounter();
  const saveDiagnosis = useCallback(data => {
    onSaveDiagnosis(data);
    fetchData();
  }, []);

  return (
    <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
      <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={saveDiagnosis} {...rest} />
    </Modal>
  );
});

export const DiagnosisModal = connectApi((api, dispatch, { encounterId, onClose }) => ({
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

    onClose();
    dispatch(push(`/patients/encounter/`));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);
