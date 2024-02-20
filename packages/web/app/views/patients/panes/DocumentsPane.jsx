import React, { useCallback, useState, useEffect } from 'react';
import { extension } from 'mime-types';

import { useApi } from '../../../api';
import { notify, notifyError, notifySuccess } from '../../../utils';

import { DocumentPreviewModal } from '../../../components/DocumentPreview';
import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { TabPane } from '../components';
import { Button, ContentPane, OutlinedButton, TableButtonRow } from '../../../components';
import { useRefreshCount } from '../../../hooks/useRefreshCount';
import { saveFile } from '../../../utils/fileSystemAccess';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';

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
  const { getTranslation } = useTranslation();
  const [dataUrl, setDataUrl] = useState('');

  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [refreshCount, updateRefreshCount] = useRefreshCount();

  const isFromEncounter = !!encounter?.id;

  const baseRoute = isFromEncounter ? `encounter/${encounter.id}` : `patient/${patient.id}`;
  const documentMetadataEndpoint = `${baseRoute}/documentMetadata`;
  const createPatientLetterEndpoint = `${baseRoute}/createPatientLetter`;

  // In order to make sure we cleanup any iframes we create from printing, we need to
  // trigger it in a useEffect with a cleanup function that wil remove the iframe
  // when unmounted.
  useEffect(() => {
    if (!dataUrl) return () => {};

    // create iframe & print when dataurl is loaded
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = dataUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.print();
    };

    return () => {
      // cleanup iframe when leaving documents tab
      document.body.removeChild(iframe);
    };
  }, [dataUrl]);

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

        await saveFile({
          defaultFileName: document.name,
          data: base64ToUint8Array(data),
          extensions: [fileExtension],
        });

        notifySuccess(
          getTranslation(
            'patient.documents.download.successMessage',
            'Successfully downloaded file',
          ),
        );
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
        const url = URL.createObjectURL(
          new Blob([Buffer.from(data, 'base64').buffer], { type: 'application/pdf' }),
        );

        // Setting/changing the dataUrl triggers the useEffect that handles printing logic
        setDataUrl(url);
      } catch (error) {
        notifyError(error.message);
      }
    },
    [api],
  );

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
            <TranslatedText
              stringId="document.action.openPatientLetter"
              fallback="Patient letter"
            />
          </OutlinedButton>
          <Button onClick={() => setModalStatus(MODAL_STATES.DOCUMENT_OPEN)}>
            <TranslatedText stringId="document.action.addDocument" fallback="Add document" />
          </Button>
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
        refreshTable={updateRefreshCount}
        openDocumentPreview={openDocumentPreview}
        patient={patient}
      />
      <DocumentModal
        open={modalStatus === MODAL_STATES.DOCUMENT_OPEN}
        onClose={closeModal}
        endpoint={documentMetadataEndpoint}
        refreshTable={updateRefreshCount}
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
