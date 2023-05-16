import React, { useState, useCallback } from 'react';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { TabPane } from '../components';
import { OutlinedButton, Button, ContentPane, TableButtonRow } from '../../../components';

const MODAL_STATES = {
  DOCUMENT_OPEN: 'document',
  PATIENT_LETTER_OPEN: 'patient_letter',
  CLOSED: 'closed',
};

// TODO: implement more robust solution since navigator.onLine isn't completely
// reliable and might give false positives

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const endpoint = encounter ? `encounter/${encounter.id}` : `patient/${patient.id}`;

  console.log('patient', patient);

  const isFromEncounter = !!encounter?.id;
  const PaneWrapper = isFromEncounter ? TabPane : ContentPane;

  const refreshTable = useCallback(() => setRefreshCount(count => count + 1), [setRefreshCount]);

  return (
    <>
      {!isFromEncounter && <DocumentsSearchBar setSearchParameters={setSearchParameters} />}
      <PaneWrapper>
        <TableButtonRow variant="small">
          <OutlinedButton onClick={() => setModalStatus(MODAL_STATES.PATIENT_LETTER_OPEN)}>
            Patient letter
          </OutlinedButton>
          <Button onClick={() => setModalStatus(MODAL_STATES.DOCUMENT_OPEN)}>Add document</Button>
        </TableButtonRow>
        <DocumentsTable
          endpoint={`${endpoint}/documentMetadata`}
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
        />
      </PaneWrapper>
      <PatientLetterModal
        open={modalStatus === MODAL_STATES.PATIENT_LETTER_OPEN}
        onClose={() => setModalStatus(MODAL_STATES.CLOSED)}
        endpoint={endpoint}
        refreshTable={refreshTable}
        setSelectedDocument={setSelectedDocument}
        patient={patient}
      />
      <DocumentModal
        open={modalStatus === MODAL_STATES.DOCUMENT_OPEN}
        onClose={() => setModalStatus(MODAL_STATES.CLOSED)}
        endpoint={endpoint}
        refreshTable={refreshTable}
      />
    </>
  );
});
