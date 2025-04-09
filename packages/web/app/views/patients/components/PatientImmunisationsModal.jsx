import React from 'react';
import { Modal, ModalActionRow } from '../../../components';
import { ImmunisationsTable } from '../../../features';

export const PatientImmunisationsModal = React.memo(({ open, patient, onClose, ...props }) => (
  <Modal
    title={`${patient.firstName} ${patient.lastName} | Immunisation history`}
    open={open}
    onClose={onClose}
    {...props}
    data-testid='modal-wm16'>
    <ImmunisationsTable
      patient={patient}
      viewOnly
      disablePagination
      data-testid='immunisationstable-rs2l' />
    <ModalActionRow confirmText="Close" onConfirm={onClose} data-testid='modalactionrow-ejho' />
  </Modal>
));
