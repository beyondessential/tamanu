import React from 'react';
import { Modal, ModalActionRow } from '../../../components';
import { ImmunisationsTable } from '../../../features';

export const PatientImmunisationsModal = React.memo(({ open, patient, onClose, ...props }) => (
  <Modal
    title={`${patient.firstName} ${patient.lastName} | Immunisation history`}
    open={open}
    onClose={onClose}
    {...props}
  >
    <ImmunisationsTable patient={patient} viewOnly disablePagination />
    <ModalActionRow confirmText="Close" onConfirm={onClose} />
  </Modal>
));
