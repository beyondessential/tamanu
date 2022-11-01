import React from 'react';
import { useApi } from '../../../api';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { ConfirmCancelRow, Form, FormGrid, Modal } from '../../../components';

export const CancelPatientMoveModal = ({ encounter, onClose }) => {
  const api = useApi();
  const { navigateToEncounter } = usePatientNavigation();

  const onSubmit = async data => {
    await api.put(`encounter/${encounter.id}/plannedLocation`, data);
    navigateToEncounter(encounter.id);
    onClose();
  };

  return (
    <Modal title="Cancel move" endpoint="plannedLocation">
      <Form
        initialValues={{ plannedLocation: encounter.plannedLocation }}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <FormGrid columns={1}>
            <div>{`Are you sure you want to cancel ${encounter.patient[0].firstName}'s scheduled move to ${encounter.plannedLocation.name}?`}</div>
            <ConfirmCancelRow
              onConfirm={submitForm}
              confirmText="Yes, cancel"
              cancelText="Keep it"
              onCancel={onClose}
            />
          </FormGrid>
        )}
      />
    </Modal>
  );
};
