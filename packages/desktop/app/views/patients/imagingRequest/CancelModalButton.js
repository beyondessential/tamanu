import React, { useState } from 'react';
import { push } from 'connected-react-router';

import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/shared/constants';

import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';
import { CancelModal } from '../../../components/CancelModal';
import { Button } from '../../../components/Button';
import { useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { ENCOUNTER_TAB_NAMES } from '../../../constants/encounterTabNames';

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

export const CancelModalButton = ({ imagingRequest }) => {
  const [isOpen, setIsOpen] = useState(false);

  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const cancellationReasonOptions = getLocalisation('imagingCancellationReasons') || [];

  const dispatch = useDispatch();
  const params = useParams();
  const onConfirmCancel = async ({ reasonForCancellation }) => {
    const reasonText = cancellationReasonOptions.find(x => x.value === reasonForCancellation).label;
    const note = `Request cancelled. Reason: ${reasonText}.`;
    const status = getReasonForCancellationStatus(reasonForCancellation);
    await api.put(`imagingRequest/${imagingRequest.id}`, {
      status,
      reasonForCancellation,
      note,
    });
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.IMAGING}`,
      ),
    );
  };

  return (
    <>
      <Button variant="text" onClick={() => setIsOpen(true)}>
        Cancel request
      </Button>
      <CancelModal
        title="Cancel imaging request"
        helperText="This reason will permanently delete the imaging request record"
        bodyText="Please select reason for cancelling imaging request and click 'Confirm'"
        options={cancellationReasonOptions}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirmCancel}
      />
    </>
  );
};
