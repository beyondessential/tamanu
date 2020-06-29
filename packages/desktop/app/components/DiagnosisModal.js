import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewEncounter } from '../store/encounter';
import { showDecisionSupport } from '../store/decisionSupport';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(({ diagnosis, onClose, onSaveDiagnosis, ...rest }) => (
  <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
    <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={onSaveDiagnosis} {...rest} />
  </Modal>
));

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
    dispatch(viewEncounter(encounterId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);
