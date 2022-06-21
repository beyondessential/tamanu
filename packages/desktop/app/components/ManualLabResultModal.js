import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Modal } from './Modal';

import { ManualLabResultForm } from '../forms/ManualLabResultForm';
import { useLabRequest } from '../contexts/LabRequest';

export const ManualLabResultModal = ({ labTest, onClose, open }) => {
  const { updateLabTest, labRequest } = useLabRequest();
  const params = useParams();
  const onSubmit = useCallback(
    ({ result, completedDate, laboratoryOfficer, labTestMethodId, verification }) => {
      updateLabTest(
        params.patientId,
        params.encounterId,
        labRequest.id,
        labTest.id,
        {
          result: `${result}`,
          completedDate,
          laboratoryOfficer,
          verification,
          labTestMethodId,
        },
        params.category,
      );
      onClose();
    },
    [
      labRequest,
      labTest,
      onClose,
      updateLabTest,
      params.patientId,
      params.encounterId,
      params.category,
    ],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enter result – ${labTest && labTest.labTestType.name}`}
    >
      <ManualLabResultForm labTest={labTest} onSubmit={onSubmit} onClose={onClose} />
    </Modal>
  );
};
