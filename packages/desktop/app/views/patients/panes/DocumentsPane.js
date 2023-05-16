import React, { useState, useCallback, useEffect } from 'react';
import { promises as asyncFs } from 'fs';
import { extension, lookup as lookupMimeType } from 'mime-types';
import { ForbiddenError } from 'shared/errors';
import { DocumentsTable } from '../../../components/DocumentsTable';
import { DocumentModal } from '../../../components/DocumentModal';
import { PatientLetterModal } from '../../../components/PatientLetterModal';
import { DocumentsSearchBar } from '../../../components/DocumentsSearchBar';
import { useApi } from '../../../api';
import { TabPane } from '../components';
import { OutlinedButton, Button, ContentPane, TableButtonRow } from '../../../components';
import {
  getCurrentDateTimeString,
  toDateTimeString,
} from '../../../../../shared-src/src/utils/dateTime';
import { DOCUMENT_TYPES } from '../../../constants';

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

const getType = (attachmentType) => {
  const fileExtension = extension(attachmentType);
  if (typeof fileExtension === 'string') return fileExtension.toUpperCase();
  return 'Unknown';
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
  const [awaitingPrintRedirect, setAwaitingPrintRedirect] = useState(false );
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.CLOSED);
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const api = useApi();
  const endpoint = encounter
    ? `encounter/${encounter.id}/documentMetadata`
    : `patient/${patient.id}/documentMetadata`;


  // Transition to print page as soon as we have the generated id
  // useEffect(() => {
  //   (async () => {
  //     if (awaitingPrintRedirect && requestId) {
  //       await dispatch(reloadImagingRequest(requestId));
  //       navigateToImagingRequest(requestId, 'print');
  //     }
  //   })();
  // }, [requestId, awaitingPrintRedirect, dispatch, navigateToImagingRequest]);

  const handlePatientLetterSubmit = useCallback(async ({ submissionType, ...data }) => {
      const endpoint2 = encounter
        ? `encounter/${encounter.id}/createPatientLetter`
        : `patient/${patient.id}/createPatientLetter`;
      
      api.post(endpoint2, {
        patientLetterData: {
          todo: 'TODO',
        },
        type: DOCUMENT_TYPES.PATIENT_LETTER,
        name: data.title,
        documentOwner: data.clinicianId,
        documentCreatedAt: getCurrentDateTimeString(),
        documentUploadedAt: getCurrentDateTimeString(),
      })
      console.log('Submitted!', submissionType, data);
      setModalStatus(MODAL_STATES.CLOSED);
    },
    [setModalStatus]
  );

  // Allows to check internet connection and set error modal from child components
  const canInvokeDocumentAction = useCallback(() => {
    if (!hasInternetConnection) {
      console.log('get picked up by the linter - call the function above')
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
        await api.postWithFileUpload(endpoint, file, {
          ...data,
          attachmentType,
          // TODO: Remove hack
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
          <OutlinedButton onClick={() => setModalStatus(MODAL_STATES.PATIENT_LETTER_OPEN)}>Patient letter</OutlinedButton>
          <Button onClick={() => setModalStatus(MODAL_STATES.DOCUMENT_OPEN)}>Add document</Button>
        </TableButtonRow>
        <DocumentsTable
          endpoint={endpoint}
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          canInvokeDocumentAction={canInvokeDocumentAction}
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
