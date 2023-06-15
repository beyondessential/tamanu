import React from 'react';
import { Modal } from '../../../components';
import { EditPatientLetterTemplateForm } from './EditPatientLetterTemplateForm';

export const EditTemplateModal = ({ template, onClose, open, onSubmit, onDelete }) => (
  <Modal title="Patient Letter" open={open} onClose={onClose}>
    <EditPatientLetterTemplateForm
      onSubmit={onSubmit}
      editedObject={template}
      onDelete={onDelete}
      onClose={onClose}
    />
  </Modal>
);
