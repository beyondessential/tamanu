import React, { useState, useCallback } from 'react';
import { promises as asyncFs } from 'fs';
import { extension } from 'mime-types';

import { useApi } from '../../../api';
import { useElectron } from '../../../contexts/Electron';
import { notify, notifySuccess, notifyError } from '../../../utils';

import { DocumentPreviewModal } from '../../../components/DocumentPreview';
import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { TabPane } from '../components';
import { OutlinedButton, Button, ContentPane, TableButtonRow } from '../../../components';

const MODAL_STATES = {
  DOCUMENT_OPEN: 'document',
  PATIENT_LETTER_OPEN: 'patient_letter',
  DOCUMENT_PREVIEW_OPEN: 'document_preview',
  CLOSED: 'closed',
};

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  const api = useApi();
  const { showSaveDialog, openPath } = useElectron();

  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const isFromEncounter = !!encounter?.id;
  
  const endpoint = isFromEncounter ? `encounter/${encounter.id}` : `patient/${patient.id}`;
  
  const onDownload = useCallback(
    async document => {
      if (!navigator.onLine) {
        throw new Error(
          'You do not currently have an internet connection. Documents require live internet to download.',
        );
      }

      // Suggest a filename that matches the document name
      const path = await showSaveDialog({ defaultPath: document.name });
      if (path.canceled) return;

      try {
        // Give feedback to user that download is starting
        notify('Your download has started, please wait.', { type: 'info' });

        // Download attachment (*currently the API only supports base64 responses)
        const { data, type } = await api.get(`attachment/${document.attachmentId}`, {
          base64: true,
        });

        // If the extension is unknown, save it without extension
        const fileExtension = extension(type);
        const fullFilePath = fileExtension ? `${path.filePath}.${fileExtension}` : path.filePath;

        // Create file and open it
        await asyncFs.writeFile(fullFilePath, data, { encoding: 'base64' });
        notifySuccess(`Successfully downloaded file at: ${fullFilePath}`);
        openPath(fullFilePath);
      } catch (error) {
        notifyError(error.message);
      }
    },
    [api, openPath, showSaveDialog],
  );

  const refreshTable = useCallback(() => setRefreshCount(count => count + 1), [setRefreshCount]);
  const closeModal = useCallback(() => setModalStatus(MODAL_STATES.CLOSED), [setModalStatus]);
  const downloadCurrent = useCallback(() => onDownload(selectedDocument), [
    onDownload,
    selectedDocument,
  ]);
  const openDocumentPreview = useCallback(
    document => {
      setSelectedDocument(document);
      setModalStatus(MODAL_STATES.DOCUMENT_PREVIEW_OPEN);
    },
    [setSelectedDocument, setModalStatus],
  );
      
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
          onDownload={onDownload}
          openDocumentPreview={openDocumentPreview}
        />
      </PaneWrapper>
      <PatientLetterModal
        open={modalStatus === MODAL_STATES.PATIENT_LETTER_OPEN}
        onClose={closeModal}
        endpoint={endpoint}
        refreshTable={refreshTable}
        openDocumentPreview={openDocumentPreview}
        patient={patient}
      />
      <DocumentModal
        open={modalStatus === MODAL_STATES.DOCUMENT_OPEN}
        onClose={closeModal}
        endpoint={endpoint}
        refreshTable={refreshTable}
      />
      <DocumentPreviewModal
        open={modalStatus === MODAL_STATES.DOCUMENT_PREVIEW_OPEN}
        onClose={closeModal}
        document={selectedDocument ?? {}}
        onDownload={downloadCurrent}
      />
    </>
  );
});
