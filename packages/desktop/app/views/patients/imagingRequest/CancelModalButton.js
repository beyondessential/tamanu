import React, { useState } from 'react';

import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';

import { CancelModal } from '../../../components/CancelModal';
import { Button } from '../../../components/Button';
import { useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

function getReasonForCancellationStatus(reasonForCancellation) {
  // these values are set in localisation
  switch (reasonForCancellation) {
    case 'duplicate':
      return IMAGING_REQUEST_STATUS_TYPES.DELETED;
    case 'entered-in-error':
      return IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR;
    default:
      return IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  }
}

export const CancelModalButton = ({ imagingRequest, onCancel }) => {
  const [isOpen, setIsOpen] = useState(false);

  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const cancellationReasonOptions = getLocalisation('imagingCancellationReasons') || [];

  const onConfirmCancel = async ({ reasonForCancellation }) => {
    const reasonText = cancellationReasonOptions.find(x => x.value === reasonForCancellation).label;
    const note = `Request cancelled. Reason: ${reasonText}.`;
    const status = getReasonForCancellationStatus(reasonForCancellation);
    await api.put(`imagingRequest/${imagingRequest.id}`, {
      status,
      reasonForCancellation,
      note,
    });
    onCancel();
  };

  return (
    <>
      <Button variant="text" onClick={() => setIsOpen(true)}>
        <TranslatedText stringId="imaging.action.cancelRequest" fallback="Cancel request" />
      </Button>
      <CancelModal
        title={
          <TranslatedText stringId="imaging.modal.cancel.title" fallback="Cancel imaging request" />
        }
        helperText={
          <TranslatedText
            stringId="imaging.modal.cancel.helperText"
            fallback="This reason will permanently delete the imaging request record"
          />
        }
        bodyText={
          <TranslatedText
            stringId="imaging.modal.cancel.reasonText"
            fallback="Please select reason for cancelling imaging request and click 'Confirm'"
          />
        }
        options={cancellationReasonOptions}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirmCancel}
      />
    </>
  );
};
