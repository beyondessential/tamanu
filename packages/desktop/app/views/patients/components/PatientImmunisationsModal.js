import React from 'react';

import { ImmunisationsTable, Modal } from '../../../components';

export const PatientImmunisationsModal = React.memo(({ open, patient, onClose, ...props }) => (
  <Modal
    title={`${patient.firstName} ${patient.lastName} Immunisation History`}
    open={open}
    onClose={onClose}
    {...props}
  >
    <ImmunisationsTable patient={patient} />
  </Modal>
));
