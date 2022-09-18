import React from 'react';
import { Modal } from './Modal';
import { OutlinedButton } from './Button';
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
    [field],
  );

  return (
    <>
      <OutlinedButton onClick={openModal}>Record vitals</OutlinedButton>
      <Modal open={isOpen} onClose={closeModal}>
        <VitalsForm editedObject={field.value || {}} onSubmit={onSubmit} onCancel={closeModal} />
      </Modal>
    </>
  );
};
