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
  CLOSED: 'closed',
  DOCUMENT_OPEN: 'document',
  PATIENT_LETTER_OPEN: 'patient_letter',
  ALERT_NO_INTERNET_OPEN: 'alert_no_internet',
  ALERT_NO_SPACE_OPEN: 'alert_no_space',
};

const DOCUMENT_MODAL_STATES = [
  MODAL_STATES.DOCUMENT_OPEN,
  MODAL_STATES.ALERT_NO_INTERNET_OPEN,
  MODAL_STATES.ALERT_NO_SPACE_OPEN,
];

const DOCUMENT_ACTIONS = {
  DELETE: 'delete',
  VIEW: 'view',
};

const EXTENSION_TO_DOCUMENT_TYPE = {
  PDF: DOCUMENT_TYPES.RAW_PDF,
  JPEG: DOCUMENT_TYPES.RAW_JPEG,
};

const getType = attachmentType => {
  const fileExtension = extension(attachmentType)?.toUpperCase();
  if (typeof fileExtension !== 'string') {
    throw new Error('Unsupported file type');
  };

  return EXTENSION_TO_DOCUMENT_TYPE[fileExtension] ?? fileExtension;
};

// Checking connection is done in two places for documents (uploading, downloading).
// TODO: implement more robust solution since navigator.onLine isn't completely
// reliable and might give false positives
const hasInternetConnection = () => {
  if (navigator.onLine) {
    return true;
  }
  return false;
};

export const DocumentsPane = React.memo(({ encounter, patient }) => {
  // const dispatch = useDispatch();
  // const { navigateToImagingRequest } = usePatientNavigation();
  // const { loadEncounter } = useEncounter();
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentAction, setDocumentAction] = useState(null);

  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}`
    : `patient/${patient.id}`;

  const handlePatientLetterSubmit = useCallback(
    async ({ submissionType, ...data }) => {
      const document = await api.post(`${endpoint}/createPatientLetter`, {
        patientLetterData: {
          todo: 'TODO',
        },
        type: DOCUMENT_TYPES.PATIENT_LETTER,
        name: data.title,
        clinicianId: data.clinicianId,
        documentCreatedAt: getCurrentDateTimeString(),
        documentUploadedAt: getCurrentDateTimeString(),
      });
      setRefreshCount(count => count + 1);
      console.log('Submitted!', submissionType, data);
      if (submissionType === 'Finalise'){
        setModalStatus(MODAL_STATES.CLOSED);
        return;
      }
      else if (submissionType === 'FinaliseAndPrint'){
        setModalStatus(MODAL_STATES.CLOSED);
        setSelectedDocument(document);
        setDocumentAction(DOCUMENT_ACTIONS.VIEW);
        return;
      }
      else {
        throw new Error('Unrecognised submission type')
      }
    },
    [setModalStatus, api, endpoint, setRefreshCount, setSelectedDocument, setDocumentAction],
  );

  // Allows to check internet connection and set error modal from child components
  const canInvokeDocumentAction = useCallback(() => {
    if (!hasInternetConnection) {
      console.log('get picked up by the linter - call the function above');
      setModalStatus(MODAL_STATES.ALERT_NO_INTERNET_OPEN);
      return false;
    }

    return true;
  }, []);

  const handleSubmit = useCallback(
    async ({ file, ...data }) => {
      // Modal error will be set and shouldn't try to submit
      if (!canInvokeDocumentAction()) {
        return;
      }

      try {
        // Read and inject document creation date and type to metadata sent
        const { birthtime } = await asyncFs.stat(file);
        const attachmentType = lookupMimeType(file);
        await api.postWithFileUpload(`${endpoint}/documentMetadata`, file, {
          ...data,
          attachmentType,
          type: getType(attachmentType),
          documentCreatedAt: toDateTimeString(birthtime),
          documentUploadedAt: getCurrentDateTimeString(),
        });
        setModalStatus(MODAL_STATES.CLOSED);
        setRefreshCount(refreshCount + 1);
      } catch (error) {
        // Assume that if submission fails is because of lack of storage
        if (error instanceof ForbiddenError) {
          throw error; // allow error to be caught by error boundary
        } else {
          setModalStatus(MODAL_STATES.ALERT_NO_SPACE_OPEN);
        }
      }
    },
    [refreshCount, api, endpoint, canInvokeDocumentAction],
  );

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
          canInvokeDocumentAction={canInvokeDocumentAction}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          documentAction={documentAction}
          setDocumentAction={setDocumentAction}
        />
      </PaneWrapper>
      <PatientLetterModal
        open={modalStatus === MODAL_STATES.PATIENT_LETTER_OPEN}
        onClose={() => setModalStatus(MODAL_STATES.CLOSED)}
        onSubmit={handlePatientLetterSubmit}
        patient={patient}
      />
      <DocumentModal
        open={DOCUMENT_MODAL_STATES.includes(modalStatus)}
        onClose={() => setModalStatus(MODAL_STATES.CLOSED)}
        onSubmit={handleSubmit}
        isError={
          modalStatus === MODAL_STATES.ALERT_NO_INTERNET_OPEN ||
          modalStatus === MODAL_STATES.ALERT_NO_SPACE_OPEN
        }
      />
    </>
  );
});
