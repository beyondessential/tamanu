import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';

import { Modal } from './Modal';
import { ManualLabResultForm } from '../forms/ManualLabResultForm';

import { useLabRequest } from '../contexts/LabRequest';

export const ManualLabResultModal = ({ labTest, onClose, open }) => {
  const { updateLabTest, labRequest } = useLabRequest();
  const params = useParams();
  const dispatch = useDispatch();
  const onSubmit = useCallback(
    async ({ result, completedDate, laboratoryOfficer, labTestMethodId, verification }) => {
      await updateLabTest(labRequest.id, labTest.id, {
        result: `${result}`,
        completedDate,
        laboratoryOfficer,
        verification,
        labTestMethodId,
      });
      dispatch(
        push(
          `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}/lab-request/${labRequest.id}/`,
        ),
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
      dispatch,
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
