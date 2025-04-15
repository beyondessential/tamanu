import React, { useState } from 'react';
import { Modal } from './Modal';
import { OutlinedButton } from './Button';
import { VitalsForm } from '../forms';

export const NestedVitalsModal = React.memo(({ field, patient, encounterType }) => {
  const [isOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const onSubmit = (data) => {
    field.onChange({ target: { name: field.name, value: data } });
    setModalOpen(false);
  };

  return (
    <>
      <OutlinedButton onClick={openModal} data-testid="outlinedbutton-pp8c">
        Record vitals
      </OutlinedButton>
      <Modal open={isOpen} onClose={closeModal} title="Record vitals" data-testid="modal-yu0a">
        <VitalsForm
          patient={patient}
          onSubmit={onSubmit}
          onClose={closeModal}
          encounterType={encounterType}
          data-testid="vitalsform-1q8e"
        />
      </Modal>
    </>
  );
});
