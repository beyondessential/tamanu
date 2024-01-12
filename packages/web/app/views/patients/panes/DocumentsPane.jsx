import React, { useState, useCallback } from 'react';
import { extension } from 'mime-types';

import { useApi } from '../../../api';
import { notify, notifySuccess, notifyError } from '../../../utils';

import { DocumentPreviewModal } from '../../../components/DocumentPreview';
import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { TabPane } from '../components';
import { OutlinedButton, Button, ContentPane, TableButtonRow } from '../../../components';
import { createFileSystemHandle } from '../../../utils/fileSystemAccess';

const MODAL_STATES = {
  DOCUMENT_OPEN: 'document',
  PATIENT_LETTER_OPEN: 'patient_letter',
  DOCUMENT_PREVIEW_OPEN: 'document_preview',
  CLOSED: 'closed',
};

const base64ToUint8Array = base64 => {
  const binString = atob(base64);
  return Uint8Array.from(binString, m => m.codePointAt(0));
};

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  const api = useApi();
  // const { showSaveDialog, openPath, writeFile } = useElectron();

  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const isFromEncounter = !!encounter?.id;

  const baseRoute = isFromEncounter ? `encounter/${encounter.id}` : `patient/${patient.id}`;
  const documentMetadataEndpoint = `${baseRoute}/documentMetadata`;
  const createPatientLetterEndpoint = `${baseRoute}/createPatientLetter`;

  const onDownload = useCallback(
    async document => {
      try {
        // Give feedback to user that download is starting
        notify('Your download has started, please wait.', { type: 'info' });

        // Download attachment (*currently the API only supports base64 responses)
        const { data } = await api.get(`attachment/${document.attachmentId}`, {
          base64: true,
        });

        const fileExtension = extension(document.type);

        const fileHandle = await createFileSystemHandle({
          defaultFileName: document.name,
          extensions: [fileExtension],
        });

        const writable = await fileHandle.createWritable();

        const fileUint8Array = base64ToUint8Array(data);

        await writable.write(fileUint8Array);
        await writable.close();
        notifySuccess(`Successfully downloaded file`);
      } catch (error) {
        notifyError(error.message);
      }
    },
    [api],
  );

  const onPrintPDF = useCallback(
    async attachmentId => {
      try {
        const { data } = await api.get(`attachment/${attachmentId}`, {
          base64: true,
        });
        const dataUri = `data:application/pdf;base64,${data}`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = dataUri;

        document.body.appendChild(iframe);

        iframe.onload = () => {
          // Print the PDF after it's loaded in the iframe
          iframe.contentWindow.print();
        };
      } catch (error) {
        notifyError(error.message);
      }
    },
    [api],
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
          endpoint={documentMetadataEndpoint}
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          onDownload={onDownload}
          openDocumentPreview={openDocumentPreview}
        />
      </PaneWrapper>
      <PatientLetterModal
        open={modalStatus === MODAL_STATES.PATIENT_LETTER_OPEN}
        onClose={closeModal}
        endpoint={createPatientLetterEndpoint}
        refreshTable={refreshTable}
        openDocumentPreview={openDocumentPreview}
        patient={patient}
      />
      <DocumentModal
        open={modalStatus === MODAL_STATES.DOCUMENT_OPEN}
        onClose={closeModal}
        endpoint={documentMetadataEndpoint}
        refreshTable={refreshTable}
      />
      <DocumentPreviewModal
        open={modalStatus === MODAL_STATES.DOCUMENT_PREVIEW_OPEN}
        onClose={closeModal}
        document={selectedDocument ?? {}}
        onDownload={downloadCurrent}
        onPrintPDF={onPrintPDF}
      />
    </>
  );
});
