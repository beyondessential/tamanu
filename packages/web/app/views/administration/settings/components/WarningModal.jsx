import React from 'react';
import { ConfirmModal } from '../../../../components/ConfirmModal';

/* TODO: translations */
export const WarningModal = ({ open, setWarningModalOpen, resolveFn }) => (
  <ConfirmModal
    title="Unsaved changes"
    subText="You have unsaved changes. Are you sure you would like to discard those changes?"
    open={open}
    onConfirm={() => {
      setWarningModalOpen(false);
      resolveFn(true);
    }}
    confirmButtonText="Discard changes"
    onCancel={() => {
      setWarningModalOpen(false);
      resolveFn(false);
    }}
    cancelButtonText="Go back"
  />
);
