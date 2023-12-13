import React, { useState } from 'react';
import { VitalsForm } from '../forms';
import { OutlinedButton } from './Button';
import { Modal } from './Modal';

export const NestedVitalsModal = React.memo(({ field, patient, encounterType }) => {
  const [isOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const onSubmit = data => {
    field.onChange({ target: { name: field.name, value: data } });
    setModalOpen(false);
  };

  return (
    <>
      <OutlinedButton onClick={openModal}>Record vitals</OutlinedButton>
      <Modal open={isOpen} onClose={closeModal} title="Record vitals">
        <VitalsForm
          patient={patient}
          onSubmit={onSubmit}
          onClose={closeModal}
          encounterType={encounterType}
        />
      </Modal>
    </>
  );
});
