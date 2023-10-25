import React from 'react';
import { LAB_REQUEST_STATUSES, NOTE_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { useAuth } from '../../../contexts/Auth';
import { DeleteEncounterForm } from '../../../forms/DeleteEncounterForm';
import { Modal } from '../../../components/Modal';

export const DeleteEncounterModal = ({ open, onClose, deleteEncounter, data }) => {
  const api = useApi();
  const auth = useAuth();

  const onConfirmCancel = async () => {
    // TODO - api call to delete encounter

    await deleteEncounter();
    onClose();
  };

  return (
    <Modal width="md" title="Delete encounter record" onClose={onClose} open>
      <DeleteEncounterForm data={data} />
    </Modal>
  );
};
