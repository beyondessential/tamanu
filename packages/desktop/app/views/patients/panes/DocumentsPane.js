import React, { useState, useCallback } from 'react';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DocumentModal } from '../../../components/DocumentModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';

import { useApi } from '../../../api';

export const DocumentsPane = React.memo(({ encounter, patient, showSearchBar = false }) => {
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}/documentMetadata`
    : `patient/${patient.id}/documentMetadata`;

  const handleClose = useCallback(() => setDocumentModalOpen(false), []);

  const handleSubmit = useCallback(
    async data => {
      setIsSubmitting(true);
      try {
        await api.post(endpoint, data);
        setDocumentModalOpen(false);
        setRefreshCount(refreshCount + 1);
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshCount, api, endpoint],
  );

  return (
    <div>
      <DocumentModal
        open={documentModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        title="Add document"
        actionText="Add"
      />
      {showSearchBar && <DocumentsSearchBar setSearchParameters={setSearchParameters} />}
      <DocumentsTable
        endpoint={endpoint}
        searchParameters={searchParameters}
        refreshCount={refreshCount}
      />
      <ContentPane>
        <Button onClick={() => setDocumentModalOpen(true)} variant="contained" color="primary">
          Add document
        </Button>
      </ContentPane>
    </div>
  );
});
