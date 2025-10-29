import React from 'react';
import { ModalActionRow } from '../../../components';
import { ImmunisationsTable } from '../../../features';
import { Modal, TranslatedText } from '@tamanu/ui-components';

export const PatientImmunisationsModal = React.memo(({ open, patient, onClose, ...props }) => (
  <Modal
    title={
      <TranslatedText
        stringId="patient.modal.immunisations.title"
        fallback=":patientName | Immunisation history"
        replacements={{ patientName: `${patient.firstName} ${patient.lastName}` }}
        data-testid="translatedtext-patient-modal-immunisations-title"
      />
    }
    open={open}
    onClose={onClose}
    {...props}
    data-testid="modal-wm16"
  >
    <ImmunisationsTable
      patient={patient}
      viewOnly
      disablePagination
      data-testid="immunisationstable-rs2l"
    />
    <ModalActionRow
      confirmText={
        <TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-testid="translatedtext-close-action"
        />
      }
      onConfirm={onClose}
      data-testid="modalactionrow-ejho"
    />
  </Modal>
));
