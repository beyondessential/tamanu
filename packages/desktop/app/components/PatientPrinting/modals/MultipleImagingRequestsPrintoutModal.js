import React from 'react';

import { Colors } from '../../../constants';
import { Modal } from '../../Modal';

import { MultipleImagingRequestsPrintout } from '../printouts/MultipleImagingRequestsPrintout';
import { TranslatedText } from '../../Translation/TranslatedText';

export const MultipleImagingRequestsPrintoutModal = ({
  open,
  onClose,
  encounter,
  imagingRequests,
}) => {
  return (
    <Modal
      title={
        <TranslatedText
          stringId="imaging.modal.printMultiple.title"
          fallback="Print imaging requests"
        />
      }
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
