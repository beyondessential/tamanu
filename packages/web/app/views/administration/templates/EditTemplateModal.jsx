import React from 'react';
import { FormModal } from '../../../components';
import { EditTemplateForm } from './EditTemplateForm';

export const EditTemplateModal = ({
  template,
  onClose,
  open,
  onSubmit,
  onDelete,
  allowInputTitleType,
}) => (
  <FormModal title="Patient Letter" open={open} onClose={onClose}>
    <EditTemplateForm
      onSubmit={onSubmit}
      editedObject={template}
      onDelete={onDelete}
      onClose={onClose}
      allowInputTitleType={allowInputTitleType}
    />
  </FormModal>
);
