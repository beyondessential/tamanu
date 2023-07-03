import React, { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { lookup as lookupMimeType } from 'mime-types';
import { Typography } from '@material-ui/core';
import { ForbiddenError } from 'shared/errors';
import { DOCUMENT_SOURCES } from 'shared/constants';
import { getCurrentDateTimeString, toDateTimeString } from 'shared/utils/dateTime';

import { useApi } from '../api';
import { useElectron } from '../contexts/Electron';
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

export const DocumentModal = React.memo(({ open, onClose, endpoint, refreshTable }) => {
  const api = useApi();
  const { getFileStatus } = useElectron();

  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setError(null);
    // Prevent user from navigating away if we're submitting a document
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose, setError]);

  const onSubmit = useCallback(
    async ({ file, ...data }) => {
      setIsSubmitting(true);

      // Read and inject document creation date and type to metadata sent
      const { birthtime } = await getFileStatus(file);
      const attachmentType = lookupMimeType(file);

      try {
        await api.postWithFileUpload(`${endpoint}/documentMetadata`, file, {
          ...data,
          type: attachmentType,
          source: DOCUMENT_SOURCES.UPLOADED,
          documentCreatedAt: toDateTimeString(birthtime),
          documentUploadedAt: getCurrentDateTimeString(),
        });
      } catch (e) {
        // Assume that if submission fails is because of lack of storage
        if (e instanceof ForbiddenError) {
          throw e; // allow error to be caught by error boundary
        } else {
          // eslint-disable-next-line no-console
          setError(e);
          setIsSubmitting(false);
          return;
        }
      }

      handleClose();
      refreshTable();
      setIsSubmitting(false);
    },
    [setIsSubmitting, handleClose, refreshTable, api, endpoint, getFileStatus],
  );

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
    <DocumentForm
      actionText="Add"
      onSubmit={onSubmit}
      onCancel={handleClose}
      editedObject={document}
    />
  );

  if (isSubmitting) {
    ModalBody = <ModalLoader loadingText="Please wait while we upload your document" />;
  } else if (error) {
    ModalBody = (
      <div>
        <MessageContainer>
          <MessageTitle>Unable to upload file</MessageTitle>
          <Message>
            File cannot be uploaded at this time. This may be due to network problems or
            insufficient storage space on your server. Please try again in a few minutes or contact
            your system administrator.
            <br />
            Error message details:
            <br />
            {error}
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
  endpoint: PropTypes.string.isRequired,
  refreshTable: PropTypes.func.isRequired,
};

DocumentModal.defaultProps = {
  open: false,
};
