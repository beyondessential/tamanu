import React, { useState, useCallback, useEffect } from 'react';
import { Typography } from '@material-ui/core';
import { promises as asyncFs } from 'fs';
import { lookup as lookupMimeType } from 'mime-types';
import styled from 'styled-components';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { ConfirmCancelRow } from '../../../components/ButtonRow';
import { DocumentModal } from '../../../components/DocumentModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';

import { useApi } from '../../../api';

// Similar to ContentPane but content is aligned to the right
const PaneButtonContainer = styled.div`
  margin: 24px;
  display: flex;
  justify-content: flex-end;
`;

const AlertNoInternetModal = React.memo(({ open, onClose }) => (
  <Modal title="No internet connection detected" open={open} onClose={onClose}>
    <Typography gutterBottom>
      <strong>
        Viewing and downloading documents in Tamanu requires a live connection to the central
        server.
      </strong>
    </Typography>
    <Typography gutterBottom>
      To save on hard drive space and improve performance, documents in Tamanu are stored on the
      central server. Please check your network connection and/or try again in a few minutes.
    </Typography>
    <ConfirmCancelRow onConfirm={onClose} confirmText="OK" />
  </Modal>
));

const AlertNoSpaceModal = React.memo(({ open, onClose }) => (
  <Modal title="Not enough storage space to upload file" open={open} onClose={onClose}>
    <Typography gutterBottom>
      The server has limited storage space remaining. To protect performance, you are currently
      unable to upload documents or images. Please speak to your system administrator to increase
      your central server&apos;s hard drive space.
    </Typography>
    <ConfirmCancelRow onConfirm={onClose} confirmText="OK" />
  </Modal>
));

const MODAL_STATES = {
  CLOSED: 'closed',
  DOCUMENT_OPEN: 'document',
  ALERT_NO_INTERNET_OPEN: 'alert_no_internet',
  ALERT_NO_SPACE_OPEN: 'alert_no_space',
};

// Checking connection is done in two places for documents (uploading, downloading).
// TODO: implement more robust solution since navigator.onLine isn't completely
// reliable and might give false positives
const hasInternetConnection = () => {
  if (navigator.onLine) {
    return true;
  }
  return false;
};

export const DocumentsPane = React.memo(({ encounter, patient, showSearchBar = false }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}/documentMetadata`
    : `patient/${patient.id}/documentMetadata`;

  // Allows to check internet connection and set error modal from child components
  const canInvokeDocumentAction = useCallback(() => {
    if (!hasInternetConnection) {
      setModalStatus(MODAL_STATES.ALERT_NO_INTERNET_OPEN);
      return false;
    }

    return true;
  }, []);

  const handleClose = useCallback(() => {
    // Prevent user from navigating away if we're submitting a document
    if (!isSubmitting) {
      setModalStatus(MODAL_STATES.CLOSED);
    }
  }, [isSubmitting]);

  const handleSubmit = useCallback(
    async ({ file, ...data }) => {
      // Modal error will be set and shouldn't try to submit
      if (!canInvokeDocumentAction()) {
        return;
      }

      setIsSubmitting(true);
      try {
        // Read and inject document creation date and type to metadata sent
        const { birthtime } = await asyncFs.stat(file);
        const type = lookupMimeType(file);
        await api.postWithFileUpload(endpoint, file, {
          ...data,
          type,
          documentCreatedAt: birthtime,
        });
        handleClose();
        setRefreshCount(refreshCount + 1);
      } catch (error) {
        // Assume that if submission fails is because of lack of storage
        setModalStatus(MODAL_STATES.ALERT_NO_SPACE_OPEN);
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshCount, api, endpoint, handleClose, canInvokeDocumentAction],
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

  return (
    <div>
      <DocumentModal
        open={modalStatus === MODAL_STATES.DOCUMENT_OPEN}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        title="Add document"
        actionText="Add"
      />
      <AlertNoInternetModal
        open={modalStatus === MODAL_STATES.ALERT_NO_INTERNET_OPEN}
        onClose={handleClose}
      />
      <AlertNoSpaceModal
        open={modalStatus === MODAL_STATES.ALERT_NO_SPACE_OPEN}
        onClose={handleClose}
      />
      {showSearchBar && <DocumentsSearchBar setSearchParameters={setSearchParameters} />}
      <PaneButtonContainer>
        <Button
          onClick={() => setModalStatus(MODAL_STATES.DOCUMENT_OPEN)}
          variant="contained"
          color="primary"
        >
          Add document
        </Button>
      </PaneButtonContainer>
      <DocumentsTable
        endpoint={endpoint}
        searchParameters={searchParameters}
        refreshCount={refreshCount}
        canInvokeDocumentAction={canInvokeDocumentAction}
      />
    </div>
  );
});
