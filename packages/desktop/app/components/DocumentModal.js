import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { Modal, ModalLoader } from './Modal';
import { DocumentForm } from '../forms/DocumentForm';
import { ConfirmCancelRow } from './ButtonRow';

const MessageContainer = styled.div`
  margin: 0 auto;
  padding: 30px 0;
  max-width: 480px;
`;

const MessageTitle = styled(Typography)`
  font-weight: 500;
  font-size: 18px;
  line-height: 21px;
  margin-bottom: 10px;
  color: ${props => props.theme.palette.error.main};
`;

const Message = styled(Typography)`
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
  font-size: 16px;
  line-height: 18px;
  margin-bottom: 30px;
`;

export const DocumentModal = React.memo(({ open, onClose, onSubmit, isSubmitting, isError }) => {
  let ModalBody = (
    <DocumentForm actionText="Add" onSubmit={onSubmit} onCancel={onClose} editedObject={document} />
  );

  if (isSubmitting) {
    ModalBody = <ModalLoader loadingText="Please wait while we upload your document" />;
  } else if (isError) {
    ModalBody = (
      <div>
        <MessageContainer>
          <MessageTitle>Unable to upload file</MessageTitle>
          <Message>
            File cannot be uploaded at this time. This may be due to network problems or
            insufficient storage space on your server. Please try again in a few minutes or contact
            your system administrator.
          </Message>
        </MessageContainer>
        <ConfirmCancelRow cancelText="Close" onCancel={onClose} />
      </div>
    );
  }

  return (
    <Modal width="md" title="Add document" open={open} onClose={onClose}>
      {ModalBody}
    </Modal>
  );
});

DocumentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isError: PropTypes.bool,
};

DocumentModal.defaultProps = {
  open: false,
  isSubmitting: false,
  isError: false,
};
