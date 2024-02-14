import React from 'react';
import { useApi } from '../../../api';
import { DeleteEncounterForm } from '../../../forms/DeleteEncounterForm';
import { Modal } from '../../../components/Modal';

export const DeleteEncounterModal = ({ open, onClose, encounterToDelete, patient }) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(`encounter/${encounterToDelete.id}`);
    onClose();
  };

  return (
    <Modal width="md" title="Delete encounter record" onClose={onClose} open={open}>
      <DeleteEncounterForm
        encounterToDelete={encounterToDelete}
        onCancel={onClose}
        onSubmit={onSubmit}
        patient={patient}
      />
    </Modal>
  );
};
