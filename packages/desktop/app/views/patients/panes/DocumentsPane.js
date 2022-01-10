import React, { useState, useCallback } from 'react';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DocumentModal } from '../../../components/DocumentModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { AlertModal } from '../../../components/AlertModal';

import { useApi } from '../../../api';

const MODAL_STATES = {
  CLOSED: 'closed',
  DOCUMENT_OPEN: 'document',
  ALERT_OPEN: 'alert',
};

export const DocumentsPane = React.memo(({ encounter, patient, showSearchBar = false }) => {
  const [modalOpen, setModalOpen] = useState(MODAL_STATES.CLOSED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}/documentMetadata`
    : `patient/${patient.id}/documentMetadata`;

  const handleClose = useCallback(() => setModalOpen(MODAL_STATES.CLOSED), []);

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

  const handleDownload = useCallback(() => {
    // TODO: Get document and download, if it fails, open alert
    // try { } catch (error) { setModalOpen(MODAL_STATES.ALERT_OPEN) }
    setModalOpen(MODAL_STATES.ALERT_OPEN);
  }, []);

  return (
    <div>
      <DocumentModal
        open={modalOpen === MODAL_STATES.DOCUMENT_OPEN}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        title="Add document"
        actionText="Add"
      />
      <AlertModal
        open={modalOpen === MODAL_STATES.ALERT_OPEN}
        onClose={handleClose}
        title="No internet connection detected"
        subtitle="Viewing and downloading documents in Tamanu requires a live connection to the central server."
        text="To save on hard drive space and improve performance, documents in Tamanu are stored on the central server. Please check your network connection and/or try again in a few minutes."
      />
      {showSearchBar && <DocumentsSearchBar setSearchParameters={setSearchParameters} />}
      <DocumentsTable
        endpoint={endpoint}
        searchParameters={searchParameters}
        refreshCount={refreshCount}
      />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(MODAL_STATES.DOCUMENT_OPEN)}
          variant="contained"
          color="primary"
        >
          Add document
        </Button>
        {/* Button just for testing purposes */}
        <Button
          variant="contained"
          color="primary"
          style={{ marginLeft: '10px' }}
          onClick={handleDownload}
        >
          Test internet alert
        </Button>
      </ContentPane>
    </div>
  );
});
