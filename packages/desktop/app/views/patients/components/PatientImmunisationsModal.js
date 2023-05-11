import React from 'react';

import { ImmunisationsTable, Modal, ModalActionRow } from '../../../components';

export const PatientImmunisationsModal = React.memo(({ open, patient, onClose, ...props }) => (
  <Modal
    title={`${patient.firstName} ${patient.lastName} Immunisation History`}
    open={open}
    onClose={onClose}
    disableHeaderCloseIcon
    {...props}
  >
    <ImmunisationsTable patient={patient} viewOnly allRows />
    <ModalActionRow confirmText="Close" onConfirm={onClose} />
  </Modal>
));
