import React from 'react';
import { LAB_REQUEST_STATUSES, NOTE_TYPES } from '@tamanu/constants';
import { useApi } from '../../../api';
import { CancelModal } from '../../../components/CancelModal';
import { useDateTime } from '@tamanu/ui-components';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const LabRequestCancelModal = React.memo(({ open, onClose, updateLabReq, labRequest }) => {
  const api = useApi();
  const auth = useAuth();
  const { getSetting } = useSettings();
  const { getCurrentDateTime } = useDateTime();
  const cancellationReasonOptions = getSetting('labsCancellationReasons');

  const onConfirmCancel = async ({ reasonForCancellation }) => {
    const reasonText = cancellationReasonOptions.find(
      option => option.value === reasonForCancellation,
    )?.label;
    const note = `Request cancelled. Reason: ${reasonText}.`;

    let status;
    if (reasonForCancellation === 'duplicate') {
      status = LAB_REQUEST_STATUSES.DELETED;
    } else if (reasonForCancellation === 'entered-in-error') {
      status = LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
    } else {
      status = LAB_REQUEST_STATUSES.CANCELLED;
    }

    await api.post(`labRequest/${labRequest.id}/notes`, {
      content: note,
      authorId: auth.currentUser.id,
      noteTypeId: NOTE_TYPES.OTHER,
      date: getCurrentDateTime(),
    });

    await updateLabReq({
      status,
      reasonForCancellation,
    });
    onClose();
  };

  return (
    <CancelModal
      title={
        <TranslatedText
          stringId="lab.modal.cancel.title"
          fallback="Cancel lab request"
          data-testid="translatedtext-lab-modal-cancel-title"
        />
      }
      open={open}
      onClose={onClose}
      options={cancellationReasonOptions}
      helperText={
        <TranslatedText
          stringId="lab.modal.cancel.helper"
          fallback="This reason will permanently delete the lab request record"
          data-testid="translatedtext-lab-modal-cancel-helper"
        />
      }
      bodyText={
        <TranslatedText
          stringId="lab.modal.cancel.body"
          fallback="Please select reason for cancelling lab request and click 'Confirm'"
          data-testid="translatedtext-lab-modal-cancel-body"
        />
      }
      onConfirm={onConfirmCancel}
      data-testid="cancelmodal-8k1s"
    />
  );
});
