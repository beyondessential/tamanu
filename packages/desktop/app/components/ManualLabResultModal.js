import React, { useCallback } from 'react';
import { useLabRequest } from '../contexts/LabRequest';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { Modal } from './Modal';
import { ManualLabResultForm } from '../forms/ManualLabResultForm';

export const ManualLabResultModal = ({ labTest, onClose, open }) => {
  const { updateLabTest, labRequest } = useLabRequest();
  const { navigateToLabRequest } = usePatientNavigation();
  const onSubmit = useCallback(
    async ({ result, completedDate, laboratoryOfficer, labTestMethodId, verification }) => {
      await updateLabTest(labRequest.id, labTest.id, {
        result: `${result}`,
        completedDate,
        laboratoryOfficer,
        verification,
        labTestMethodId,
      });
      navigateToLabRequest(labRequest.id);
      onClose();
    },
    [labRequest, labTest, onClose, updateLabTest, navigateToLabRequest],
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
