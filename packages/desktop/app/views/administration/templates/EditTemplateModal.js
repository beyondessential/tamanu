import React, { useCallback } from 'react';
import styled from 'styled-components';
import { ButtonRow, Button, Modal, BlankActionRow, OutlinedDeleteButton, OutlinedButton } from '../../../components';
import { EditPatientLetterTemplateForm } from '../../../forms';

export const EditTemplateModal = ({ template, onClose, open, onSubmit, onDelete, refreshTable }) => {
  return (
    <Modal title="Patient Letter" open={open} onClose={onClose}>
      <EditPatientLetterTemplateForm onSubmit={onSubmit} editedObject={template} onDelete={onDelete} onClose={onClose}/>
    </Modal>
  );
};
