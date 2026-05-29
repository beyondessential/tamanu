import React from 'react';

import { Button } from '@tamanu/ui-components';

import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation/TranslatedText';

export const DiscardSummaryConfirmModal = ({ open, onCancel, onConfirm, isDiscarding }) => (
  <ConfirmModal
    open={open}
    onCancel={onCancel}
    onConfirm={onConfirm}
    title={
      <TranslatedText stringId="ai.patientSummary.discardModal.title" fallback="Discard AI summary" />
    }
    subText={
      <TranslatedText
        stringId="ai.patientSummary.discardModal.text"
        fallback="Are you sure you would like to discard the AI summary? You can regenerate a new AI summary at any time."
      />
    }
    ConfirmButton={Button}
    confirmButtonProps={{ disabled: isDiscarding }}
    cancelButtonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
    confirmButtonText={
      <TranslatedText stringId="ai.patientSummary.action.discard" fallback="Discard" />
    }
  />
);
