import React from 'react';
import { useApi } from '../../../api';
import { DeleteEncounterForm } from '../../../forms/DeleteEncounterForm';
import { Modal } from '../../../components/Modal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { route } from '@tamanu/api-client';

export const DeleteEncounterModal = ({ open, onClose, encounterToDelete, patient }) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(
      route('encounter/:encounterToDeleteId', { encounterToDeleteId: encounterToDelete.id }),
    );
    onClose();
  };

  return (
    <Modal
      width="md"
      title={
        <TranslatedText
          stringId="encounter.modal.delete.title"
          fallback="Delete encounter record"
        />
      }
      onClose={onClose}
      open={open}
      data-testid="modal-lsi1"
    >
      <DeleteEncounterForm
        encounterToDelete={encounterToDelete}
        onCancel={onClose}
        onSubmit={onSubmit}
        patient={patient}
        data-testid="deleteencounterform-5p2w"
      />
    </Modal>
  );
};
