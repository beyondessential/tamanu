import React, { useState } from 'react';

import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';
import { Button } from '@tamanu/ui-components';

import { CancelModal } from '../../../components/CancelModal';
import { useApi } from '../../../api';
import { useSettings } from '../../../contexts/Settings';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

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
  const { getSetting } = useSettings();
  const allCancellationReasons = getSetting('imagingCancellationReasons');
  const cancellationReasonOptions = allCancellationReasons.filter((reason) => !reason.hidden);

  const onConfirmCancel = async ({ reasonForCancellation }) => {
    const reasonText = cancellationReasonOptions.find(
      (x) => x.value === reasonForCancellation,
    ).label;
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
      <NoteModalActionBlocker>
        <Button variant="text" onClick={() => setIsOpen(true)} data-testid="button-kuzg">
          <TranslatedText
            stringId="imaging.action.cancelRequest"
            fallback="Cancel request"
            data-testid="translatedtext-xw1p"
          />
        </Button>
      </NoteModalActionBlocker>
      <CancelModal
        title={
          <TranslatedText
            stringId="imaging.modal.cancel.title"
            fallback="Cancel imaging request"
            data-testid="translatedtext-n18u"
          />
        }
        helperText={
          <TranslatedText
            stringId="imaging.modal.cancel.helperText"
            fallback="This reason will permanently delete the imaging request record"
            data-testid="translatedtext-0kx9"
          />
        }
        bodyText={
          <TranslatedText
            stringId="imaging.modal.cancel.reasonText"
            fallback="Please select reason for cancelling imaging request and click 'Confirm'"
            data-testid="translatedtext-n4m8"
          />
        }
        options={cancellationReasonOptions}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirmCancel}
        data-testid="cancelmodal-mb8n"
      />
    </>
  );
};
