import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
import { Modal } from './Modal';
import { Button } from './Button';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectInput } from './Field';
import { useLocalisation } from '../contexts/Localisation';
import { ENCOUNTER_TAB_NAMES } from '../views/patients/encounterTabNames';
import { useApi } from '../api';

export const CancelModal = React.memo(({ imagingRequest, buttonText }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const params = useParams();
  const { getLocalisation } = useLocalisation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const options = getLocalisation('imagingRequestCancellationReasons') || [];

  const onConfirm = async () => {
    console.log('reason...', reason);
    console.log('confirm...', imagingRequest);

    await api.put(`imagingRequest/${imagingRequest.id}`, {
      status: IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    });
    // Todo: investigate refactoring url util?
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.IMAGING}`,
      ),
    );
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
        <SelectInput
          label="Reason for cancellation"
          name="reasonForCancellation"
          options={options}
          value={reason}
          onChange={({ target: { value } }) => setReason(value)}
        />
        <ConfirmCancelRow onCancel={onClose} onConfirm={onConfirm} cancelText="Close" />
      </Modal>
    </>
  );
});
