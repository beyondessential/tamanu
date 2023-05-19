import React from 'react';

import { Colors } from '../../../constants';
import { Modal } from '../../Modal';

import { MultipleImagingRequestsPrintout } from '../printouts/MultipleImagingRequestsPrintout';

export const MultipleImagingRequestsPrintoutModal = ({
  open,
  onClose,
  encounter,
  imagingRequests,
}) => {
  return (
    <Modal
      title="Print imaging requests"
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
    >
      <MultipleImagingRequestsPrintout encounter={encounter} imagingRequests={imagingRequests} />
    </Modal>
  );
};
