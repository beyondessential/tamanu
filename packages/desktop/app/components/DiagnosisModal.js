import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewVisit } from '../store/visit';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(({ diagnosis, onClose, onSaveDiagnosis, icd10Suggester }) => (
  <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
    <DiagnosisForm
      onSave={onSaveDiagnosis}
      onCancel={onClose}
      diagnosis={diagnosis}
      icd10Suggester={icd10Suggester}
    />
  </Modal>
));

export const DiagnosisModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSaveDiagnosis: async data => {
    if (data._id) {
      await api.put(`patientDiagnosis/${data._id}`, data);
    } else {
      await api.post(`visit/${visitId}/diagnosis`, data);
    }

    onClose();
    dispatch(viewVisit(visitId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);
