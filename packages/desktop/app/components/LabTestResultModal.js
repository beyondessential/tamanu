import React, { useState } from 'react';

import { Modal } from './Modal';

export const LabTestResultModal = React.memo(({ open, onClose, labTestId }) => {
  return (
    <Modal title={`${labTestId}`} open={open} onClose={onClose} />
    // {ModalBody}
    // </Modal>
  );
});
