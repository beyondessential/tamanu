import React, { useState, useCallback } from 'react';
import { promises as asyncFs } from 'fs';
import { extension, lookup as lookupMimeType } from 'mime-types';

import { ForbiddenError } from 'shared/errors';
import { DOCUMENT_TYPES } from 'shared/constants';
import { getCurrentDateTimeString, toDateTimeString } from 'shared/utils/dateTime';

import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { useApi } from '../../../api';
import { TabPane } from '../components';
import { OutlinedButton, Button, ContentPane, TableButtonRow } from '../../../components';

const MODAL_STATES = {
  DOCUMENT_OPEN: 'document',
  PATIENT_LETTER_OPEN: 'patient_letter',
  CLOSED: 'closed',
};

const DOCUMENT_ACTIONS = {
  DELETE: 'delete',
  VIEW: 'view',
};

// TODO: implement more robust solution since navigator.onLine isn't completely
// reliable and might give false positives

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentAction, setDocumentAction] = useState(null);

  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}`
    : `patient/${patient.id}`;

  const isFromEncounter = !!encounter?.id;
  const PaneWrapper = isFromEncounter ? TabPane : ContentPane;

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
          endpoint={endpoint}
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          documentAction={documentAction}
          setDocumentAction={setDocumentAction}
        />
      </PaneWrapper>
      <PatientLetterModal
        open={modalStatus === MODAL_STATES.PATIENT_LETTER_OPEN}
        onClose={() => setModalStatus(MODAL_STATES.CLOSED)}
        patient={patient}
      />
      <DocumentModal
        open={modalStatus === MODAL_STATES.DOCUMENT_OPEN}
        onClose={() => setModalStatus(MODAL_STATES.CLOSED)}
      />
    </>
  );
});
