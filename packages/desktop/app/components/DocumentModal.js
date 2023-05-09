import React, { useCallback, useState, useEffect } from 'react';
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

export const DocumentModal = React.memo(({ open, onClose, onSubmit: paneOnSubmit, isError }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(async (...args) => {
      setIsSubmitting(true);
      await paneOnSubmit(...args);
      setIsSubmitting(false);
    },
    [setIsSubmitting]
  )

  const handleClose = useCallback(() => {
    // Prevent user from navigating away if we're submitting a document
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (isSubmitting) {
        // According to the electron docs, using event.returnValue is
        // is recommended rather than just returning a value.
        // https://www.electronjs.org/docs/latest/api/browser-window#event-close
        // eslint-disable-next-line no-param-reassign
        event.returnValue = false;
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubmitting]);


  let ModalBody = (
    <DocumentForm actionText="Add" onSubmit={onSubmit} onCancel={handleClose} editedObject={document} />
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
        <ConfirmCancelRow cancelText="Close" onCancel={handleClose} />
      </div>
    );
  }

  return (
    <Modal width="md" title="Add document" open={open} onClose={handleClose}>
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
