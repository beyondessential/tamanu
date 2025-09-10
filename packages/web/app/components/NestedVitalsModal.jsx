import React, { useState } from 'react';
import { VitalsForm } from '../forms';

import { OutlinedButton, TranslatedText, Modal } from '@tamanu/ui-components';

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
      <OutlinedButton onClick={openModal} data-testid="outlinedbutton-pp8c">
        <TranslatedText
          stringId="vitals.action.record"
          fallback="Record vitals"
          data-testid="translatedtext-record-vitals"
        />
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
