import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DocumentModal } from '../../../components/DocumentModal';

import { reloadPatient } from '../../../store/patient';
import { useApi } from '../../../api';

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const api = useApi();
  const dispatch = useDispatch();

  const handleClose = useCallback(() => setDocumentModalOpen(false), []);

  const handleSubmit = useCallback(
    async data => {
      await api.post(`patient/${patient.id}/documentMetadata`, data);
      setDocumentModalOpen(false);
      dispatch(reloadPatient(patient.id));
    },
    [api, patient, setDocumentModalOpen, dispatch],
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
      <DocumentsTable encounterId={encounter?.id} patientId={patient?.id} />
      <ContentPane>
        <Button onClick={() => setDocumentModalOpen(true)} variant="contained" color="primary">
          Add document
        </Button>
      </ContentPane>
    </div>
  );
});
