import React, { useCallback } from 'react';
import { Modal } from './Modal';

import { ManualLabResultForm } from '../forms/ManualLabResultForm';
import { useLabRequest } from '../contexts/LabRequest';

export const ManualLabResultModal = ({ labTest, onClose, open }) => {
  const { updateLabTest, labRequest } = useLabRequest();
  const onSubmit = useCallback(
    ({ result, completedDate, laboratoryOfficer, labTestMethodId, verification }) => {
      updateLabTest(labRequest.id, labTest.id, {
        result: `${result}`,
        completedDate,
        laboratoryOfficer,
        verification,
        labTestMethodId,
      });
      onClose();
    },
    [labRequest, labTest],
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
