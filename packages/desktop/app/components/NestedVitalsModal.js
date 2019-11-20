import React from 'react';

import { Modal } from './Modal';
import { Button } from './Button';
import { VitalsForm } from '../forms/VitalsForm';

export const NestedVitalsModal = ({ field }) => {
  const [isOpen, setModalOpen] = React.useState(false);
  const openModal = React.useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = React.useCallback(() => setModalOpen(false), [setModalOpen]);
  const onSubmit = React.useCallback(
    data => {
      field.onChange({ target: { name: field.name, value: data } });
      setModalOpen(false);
    },
    [setModalOpen, field.name, field.onChange],
  );

  return (
    <React.Fragment>
      <Button onClick={openModal} variant="contained" color="primary">
        Record vitals
      </Button>
      <Modal open={isOpen} onClose={closeModal}>
        <VitalsForm editedObject={field.value || {}} onSubmit={onSubmit} onCancel={closeModal} />
      </Modal>
    </React.Fragment>
  );
};
