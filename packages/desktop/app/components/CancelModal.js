import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../components/Button';
import { ConfirmCancelRow } from './ButtonRow';

export const CancelModal = ({ imagingRequest, buttonText }) => {
  const [open, setOpen] = useState(false);
  const onConfirm = () => {
    console.log('confirm...', imagingRequest);
  };
  const onClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Button variant="text" onClick={() => setOpen(true)}>
        {buttonText}
      </Button>
      <Modal width="sm" title="Cancel imaging request" onClose={onClose} open={open}>
        <div>Please select reason for cancelling imaging request and click Confirm</div>
        <ConfirmCancelRow onCancel={onClose} onConfirm={onConfirm} cancelText="Close" />
      </Modal>
    </>
  );
};
