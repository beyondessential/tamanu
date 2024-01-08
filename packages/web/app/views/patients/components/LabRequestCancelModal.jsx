import React from 'react';
import { LAB_REQUEST_STATUSES, NOTE_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { CancelModal } from '../../../components/CancelModal';
import { useAuth } from '../../../contexts/Auth';

export const LabRequestCancelModal = React.memo(({ open, onClose, updateLabReq, labRequest }) => {
  const api = useApi();
  const auth = useAuth();
  const { getLocalisation } = useLocalisation();
  const cancellationReasonOptions = getLocalisation('labsCancellationReasons') || [];

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
      noteType: NOTE_TYPES.OTHER,
      date: getCurrentDateTimeString(),
    });

    await updateLabReq({
      status,
      reasonForCancellation,
    });
    onClose();
  };

  return (
    <CancelModal
      title="Cancel lab request"
      open={open}
      onClose={onClose}
      options={cancellationReasonOptions}
      helperText="This reason will permanently delete the lab request record"
      bodyText="Please select reason for cancelling lab request and click 'Confirm'"
      onConfirm={onConfirmCancel}
    />
  );
});
