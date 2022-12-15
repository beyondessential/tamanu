import React from 'react';
import { Colors } from '../../constants';
import { Modal } from '../Modal';

export const MultipleImagingRequestsPrintoutModal = ({ open, onClose }) => {
  return (
    <Modal
      title="Print imaging requests"
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
    >
      <h2>TODO</h2>
    </Modal>
  );
};
