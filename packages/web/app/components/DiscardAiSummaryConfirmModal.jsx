import React from 'react';

import { Button } from '@tamanu/ui-components';

import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DiscardAiSummaryConfirmModal = ({
  title,
  subText,
  open,
  onCancel,
  onConfirm,
  isDiscarding,
  confirmButtonText = <TranslatedText stringId="general.action.discard" fallback="Discard" />,
}) => (
  <ConfirmModal
    open={open}
    onCancel={onCancel}
    onConfirm={onConfirm}
    title={title}
    subText={subText}
    ConfirmButton={Button}
    confirmButtonProps={{ disabled: isDiscarding }}
    cancelButtonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
    confirmButtonText={confirmButtonText}
  />
);
