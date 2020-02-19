import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewVisit } from '../store/visit';
import { showDecisionSupport } from '../store/decisionSupport';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(({ diagnosis, onClose, onSaveDiagnosis, ...rest }) => (
  <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
    <DiagnosisForm onCancel={onClose} diagnosis={diagnosis} onSave={onSaveDiagnosis} {...rest} />
  </Modal>
));

export const DiagnosisModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSaveDiagnosis: async data => {
    if (data._id) {
      await api.put(`patientDiagnosis/${data._id}`, data);
    } else {
      const { diagnosis, previousDiagnoses } = await api.post(`visit/${visitId}/diagnosis`, data);
      if(previousDiagnoses.length > 0) {
        dispatch(showDecisionSupport('repeatDiagnosis', {
          diagnosis,
          previousDiagnoses,
        }));
      }
    }

    onClose();
    dispatch(viewVisit(visitId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);
