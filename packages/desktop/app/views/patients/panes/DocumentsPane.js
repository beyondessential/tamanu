import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DocumentModal } from '../../../components/DocumentModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';

import { reloadPatient } from '../../../store/patient';
import { useApi } from '../../../api';

export const DocumentsPane = React.memo(({ encounter, patient, showSearchBar = false }) => {
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});
  const api = useApi();
  const dispatch = useDispatch();
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
      } finally {
        setIsSubmitting(false);
      }
      // TODO: Investigate if the sole use case of reloadPatient is to reload
      // the table data. Also the table data inside encounter view will need to
      // be refreshed as well.
      dispatch(reloadPatient(patient.id));
    },
    [api, patient, dispatch],
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
      />
      <ContentPane>
        <Button onClick={() => setDocumentModalOpen(true)} variant="contained" color="primary">
          Add document
        </Button>
      </ContentPane>
    </div>
  );
});
