import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useEncounter } from '../contexts/Encounter';
import { showDecisionSupport } from '../store/specialModals';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';
import { useApi } from '../api';

export const DiagnosisModal = ({ 
  diagnosis, 
  onClose, 
  encounterId,
  ...rest 
}) => {
  const api = useApi();
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();
  const onSaveDiagnosis = useCallback(
    async data => {
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
      await loadEncounter(encounterId);
      onClose();
    },
    [api, dispatch, loadEncounter, onClose, encounterId],
  );

  return (
    <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
      <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={onSaveDiagnosis} {...rest} />
    </Modal>
  );
};
