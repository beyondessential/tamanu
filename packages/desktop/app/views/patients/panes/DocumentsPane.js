import React, { useState, useCallback } from 'react';
import { Typography } from '@material-ui/core';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { Button } from '../../../components/Button';
import { ButtonRow } from '../../../components/ButtonRow';
import { ContentPane } from '../../../components/ContentPane';
import { DocumentModal } from '../../../components/DocumentModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { Modal } from '../../../components/Modal';

import { useApi } from '../../../api';

const AlertNoInternetModal = React.memo(({ open, onClose }) => (
  <Modal title="No internet connection detected" open={open} onClose={onClose}>
    <Typography>
      <strong>
        Viewing and downloading documents in Tamanu requires a live connection to the central
        server.
      </strong>
    </Typography>
    <Typography>
      To save on hard drive space and improve performance, documents in Tamanu are stored on the
      central server. Please check your network connection and/or try again in a few minutes.
    </Typography>
    <ConfirmCancelRow onConfirm={onClose} confirmText="OK" />
  </Modal>
));

const AlertNoSpaceModal = React.memo(({ open, onClose }) => (
  <Modal title="Not enough storage space to upload file" open={open} onClose={onClose}>
    <Typography>
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

export const DocumentsPane = React.memo(({ encounter, patient, showSearchBar = false }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}/documentMetadata`
    : `patient/${patient.id}/documentMetadata`;

  const handleClose = useCallback(() => setModalStatus(MODAL_STATES.CLOSED), []);

  const handleSubmit = useCallback(
    async data => {
      setIsSubmitting(true);
      try {
        await api.post(endpoint, data);
        handleClose();
        setRefreshCount(refreshCount + 1);
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshCount, api, endpoint, handleClose],
  );

  // Placeholder action callback, remove eslint disable when hooking up
  // eslint-disable-next-line no-unused-vars
  const handleDownload = useCallback(() => {
    // TODO: Get document and download, if it fails, open alert
    // try { } catch (error) { setModalStatus(MODAL_STATES.ALERT_OPEN) }
    setModalStatus(MODAL_STATES.ALERT_OPEN);
  }, []);

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
      <DocumentsTable
        endpoint={endpoint}
        searchParameters={searchParameters}
        refreshCount={refreshCount}
      />
      <ContentPane>
        <Button
          onClick={() => setModalStatus(MODAL_STATES.DOCUMENT_OPEN)}
          variant="contained"
          color="primary"
        >
          Add document
        </Button>
      </ContentPane>
    </div>
  );
});
