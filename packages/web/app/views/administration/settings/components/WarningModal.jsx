import React from 'react';

import { ConfirmModal } from '../../../../components/ConfirmModal';
import { TranslatedText } from '../../../../components';

export const WarningModal = ({ open, setShowWarningModal, resolveFn }) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="admin.settings.modal.unsavedChanges.title"
          fallback="Unsaved changes"
        />
      }
      subText={
        <TranslatedText
          stringId="admin.settings.modal.unsavedChanges.subtext"
          fallback="You have unsaved changes. Are you sure you would like to discard those changes?"
        />
      }
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      confirmButtonText={
        <TranslatedText stringId="general.action.discardChanges" fallback="Discard changes" />
      }
      onCancel={() => {
        handleClose(false);
      }}
      cancelButtonText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
    />
  );
};
