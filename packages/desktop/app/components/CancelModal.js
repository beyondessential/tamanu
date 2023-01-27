import React, { useState } from 'react';
import styled from 'styled-components';
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
import { BodyText } from './Typography';

const ModalBody = styled.div`
  margin-top: 30px;

  .MuiTypography-root {
    margin-bottom: 30px;
  }
`;

const Wrapper = styled.div`
  margin: 0 auto 50px;
  max-width: 350px;
`;

const getHelperTextByReason = reason => {
  switch (reason) {
    case 'duplicate':
    case 'entered-in-error':
      return 'This reason will permanently delete the imaging request record';
    default:
      return null;
  }
};

const getNoteByReason = reason => {
  return `Request cancelled. Reason: ${reason}`;
};

export const CancelModal = React.memo(({ imagingRequest, buttonText }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const params = useParams();
  const { getLocalisation } = useLocalisation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(null);
  const options = getLocalisation('imagingCancellationReasons') || [];

  const onConfirm = async () => {
    const reasonText = options.find(x => x.value === reason);
    const status =
      reason === 'duplicate' || reason === 'entered-in-error'
        ? IMAGING_REQUEST_STATUS_TYPES.DELETED
        : IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
    await api.put(`imagingRequest/${imagingRequest.id}`, {
      status,
      note: getNoteByReason(reasonText.label),
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
        <ModalBody>
          <BodyText>
            Please select reason for cancelling imaging request and click &apos;Confirm&apos;
          </BodyText>
          <Wrapper>
            <SelectInput
              label="Reason for cancellation"
              name="reasonForCancellation"
              options={options}
              value={reason}
              onChange={({ target: { value } }) => setReason(value)}
              helperText={getHelperTextByReason(reason)}
            />
          </Wrapper>
          <ConfirmCancelRow onCancel={onClose} onConfirm={onConfirm} cancelText="Close" />
        </ModalBody>
      </Modal>
    </>
  );
});
