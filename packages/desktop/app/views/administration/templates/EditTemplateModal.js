import React from 'react';
import { ButtonRow, Button, Modal } from '../../../components';
import { EditPatientLetterTemplateForm } from '../../../forms';

export const EditTemplateModal = ({ template, onClose, open }) => {
  const actions = (
    <ButtonRow>
      <Button onClick={onClose}>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title="Merge patients" actions={actions} open={open} onClose={onClose}>
      <EditPatientLetterTemplateForm />
      <p>
        <strong>Merge successful.</strong> Records updated:
      </p>
    </Modal>
  );
};
