import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { PatientDocumentsTable } from '../../../components/PatientDocumentsTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DocumentModal } from '../../../components/DocumentModal';

import { reloadPatient } from '../../../store/patient';
import { useApi } from '../../../api';

export const PatientDocumentsPane = React.memo(({ encounter, patient }) => {
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const api = useApi();
  const dispatch = useDispatch();

  const handleSave = useCallback(async () => {
    setDocumentModalOpen(false);
    dispatch(reloadPatient(patient.id));
  }, [patient]);

  const handleSubmit = useCallback(
    async data => {
      api.post(`patient/${patient.id}/documentMetadata`, data);
      handleSave();
    },
    [patient],
  );

  return (
    <div>
      <DocumentModal
        open={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        onSaved={handleSave}
        onSubmit={handleSubmit}
        title="Add document"
        actionText="Create"
      />
      <PatientDocumentsTable encounter={encounter} patientId={patient.id} />
      <ContentPane>
        <Button onClick={() => setDocumentModalOpen(true)} variant="contained" color="primary">
          Add document
        </Button>
      </ContentPane>
    </div>
  );
});
