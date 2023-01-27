import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectInput } from './Field';
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

export const CancelModal = React.memo(
  ({ title, bodyText, onConfirm, options, helperText, open, onClose }) => {
    const [reason, setReason] = useState(null);
    const isReasonForDelete = reason === 'duplicate' || reason === 'entered-in-error';

    return (
      <>
        <Modal width="sm" title={title} onClose={onClose} open={open}>
          <ModalBody>
            <BodyText>{bodyText}</BodyText>
            <Wrapper>
              <SelectInput
                label="Reason for cancellation"
                name="reasonForCancellation"
                options={options}
                value={reason}
                onChange={({ target: { value } }) => setReason(value)}
                helperText={isReasonForDelete ? helperText : null}
              />
            </Wrapper>
            <ConfirmCancelRow
              onCancel={onClose}
              onConfirm={() => onConfirm(reason, isReasonForDelete)}
              cancelText="Close"
            />
          </ModalBody>
        </Modal>
      </>
    );
  },
);
