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
  const [searchParameters, setSearchParameters] = useState({});
  const api = useApi();
  const dispatch = useDispatch();

  const handleClose = useCallback(() => setDocumentModalOpen(false), []);

  const handleSubmit = useCallback(
    async data => {
      await api.post(`patient/${patient.id}/documentMetadata`, data);
      setDocumentModalOpen(false);
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
        title="Add document"
        actionText="Create"
      />
      {showSearchBar && <DocumentsSearchBar setSearchParameters={setSearchParameters} />}
      <DocumentsTable
        encounterId={encounter?.id}
        patientId={patient?.id}
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
