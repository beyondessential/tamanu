import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewVisit } from '../store/visit';

import { Modal } from './Modal';
import { DiagnosisForm } from '../forms/DiagnosisForm';

const DumbDiagnosisModal = React.memo(({ diagnosis, onClose, ...rest }) => (
  <Modal title="Diagnosis" open={!!diagnosis} onClose={onClose}>
    <DiagnosisForm
      onCancel={onClose}
      diagnosis={diagnosis}
      {...rest}
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
