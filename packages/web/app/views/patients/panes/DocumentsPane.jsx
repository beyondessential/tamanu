import React, { useCallback, useState } from 'react';

import { DocumentPreviewModal } from '../../../components/DocumentPreview';
import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { TabPane } from '../components';
import {
  ButtonWithPermissionCheck,
  ContentPane,
  OutlinedButton,
  TableButtonRow,
  NoteBlock,
} from '../../../components';
import { useRefreshCount } from '../../../hooks/useRefreshCount';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useDocumentActions } from '../../../hooks/useDocumentActions';

const MODAL_STATES = {
  DOCUMENT_OPEN: 'document',
  PATIENT_LETTER_OPEN: 'patient_letter',
  DOCUMENT_PREVIEW_OPEN: 'document_preview',
  CLOSED: 'closed',
};

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(undefined);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const { onDownload } = useDocumentActions();

  const isFromEncounter = !!encounter?.id;

  const baseRoute = isFromEncounter ? `encounter/${encounter.id}` : `patient/${patient.id}`;
  const documentMetadataEndpoint = `${baseRoute}/documentMetadata`;
  const createPatientLetterEndpoint = `${baseRoute}/createPatientLetter`;

  const closeModal = useCallback(() => setModalStatus(MODAL_STATES.CLOSED), [setModalStatus]);
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
          <NoteBlock>
            <OutlinedButton onClick={() => setModalStatus(MODAL_STATES.PATIENT_LETTER_OPEN)}>
              <TranslatedText
                stringId="document.action.openPatientLetter"
                fallback="Patient letter"
              />
            </OutlinedButton>
          </NoteBlock>
          <NoteBlock>
            <ButtonWithPermissionCheck
              verb="create"
              noun="DocumentMetadata"
              onClick={() => setModalStatus(MODAL_STATES.DOCUMENT_OPEN)}
            >
              <TranslatedText stringId="document.action.addDocument" fallback="Add document" />
            </ButtonWithPermissionCheck>
          </NoteBlock>
        </TableButtonRow>
        <DocumentsTable
          endpoint={documentMetadataEndpoint}
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          refreshTable={updateRefreshCount}
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
        document={selectedDocument}
      />
    </>
  );
});
