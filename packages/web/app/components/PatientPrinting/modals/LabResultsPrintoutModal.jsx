import React from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';

import { Modal, TranslatedText, useTranslation, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { combineQueries, useApi } from '../../../api';
import { useEncounterDataQuery, usePatientAdditionalDataQuery } from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';
import { ForbiddenErrorModalContents } from '../../ForbiddenErrorModal';
import { ModalActionRow } from '../../ModalActionRow';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useSettings } from '../../../contexts/Settings';
import { withLabRequestPrintoutDetails } from '../../../utils/lab';
import { LabResultsPrintout } from '@tamanu/shared/utils/patientCertificates';
import { route } from '@tamanu/api-client';

// The printout needs each request's tests grouped and ordered the way the results table shows
// them, and the user who published it, neither of which travels with the request itself.
const useLabRequestDetailsQueries = labRequests => {
  const api = useApi();

  const testsQueries = useQueries({
    queries: labRequests.map(({ id }) => ({
      queryKey: ['labRequest', id, 'tests'],
      queryFn: () => api.get(route('labRequest/:labRequestId/tests', { labRequestId: id })),
    })),
  });

  const publishedLogQueries = useQueries({
    queries: labRequests.map(({ id }) => ({
      queryKey: ['labRequestLog', id, 'latest-published'],
      queryFn: () =>
        api.get(
          route('labRequestLog/labRequest/:labRequestId/latest-published', { labRequestId: id }),
        ),
    })),
  });

  const tests = combineQueries(testsQueries);
  const publishedLogs = combineQueries(publishedLogQueries);

  return {
    // Results are the document: a request whose tests failed to load would print as a block with
    // no results at all, so these are fatal. The publisher is one field of the request's header —
    // reading the status log needs its own permission, and without it the field reads "n/a".
    requiredQueries: testsQueries,
    optionalQueries: publishedLogQueries,
    labRequestsWithDetails: withLabRequestPrintoutDetails(labRequests, {
      testsResponses: tests.data,
      publishedLogs: publishedLogs.data,
    }),
  };
};

export const LabResultsPrintoutModal = React.memo(({ labRequests, patient, open, onClose }) => {
  const { translations } = useTranslation();
  const { getSetting } = useSettings();
  const { primaryTimeZone } = useDateTime();
  const api = useApi();
  const certificateQuery = useCertificate();

  const encounterQuery = useEncounterDataQuery(labRequests[0]?.encounterId);
  const additionalDataQuery = usePatientAdditionalDataQuery(patient.id);

  const isVillageEnabled = !!patient.villageId;
  const villageQuery = useQuery(
    ['referenceData', patient.villageId],
    () => api.get(route('referenceData/:villageId', { villageId: patient.villageId })),
    { enabled: isVillageEnabled },
  );

  const { requiredQueries, optionalQueries, labRequestsWithDetails } =
    useLabRequestDetailsQueries(labRequests);

  const requiredList = [certificateQuery, encounterQuery, additionalDataQuery].concat(
    isVillageEnabled ? [villageQuery] : [],
    requiredQueries,
  );
  const required = combineQueries(requiredList);
  // Everything the preview waits on, fatal or not, so the document doesn't render half-filled.
  const everything = combineQueries(requiredList.concat(optionalQueries));

  const modalProps = {
    title: (
      <TranslatedText
        stringId="lab.modal.results.title"
        fallback="Lab results"
        data-testid="translatedtext-lab-results-title"
      />
    ),
    open,
    onClose,
    width: 'md',
    color: Colors.white,
    // A failed fetch would leave a request's results silently missing, so don't offer to print one.
    printable: !required.isError && !everything.isFetching,
  };

  if (required.isError) {
    // The api client throws Problem, not the error classes it was built from, so match on status.
    const isForbidden = required.errors.some(error => error?.status === 403);
    return (
      <Modal {...modalProps} data-testid="modal-lab-results-printout-error">
        {isForbidden ? (
          <ForbiddenErrorModalContents
            onConfirm={onClose}
            data-testid="forbiddenerrormodalcontents-lab-results"
          />
        ) : (
          <>
            <p>
              <TranslatedText
                stringId="lab.modal.results.error.message"
                fallback="Part of this printout could not be loaded, so it would be incomplete. Please try again, and contact your system administrator if the problem continues."
                data-testid="translatedtext-lab-results-error"
              />
            </p>
            <ModalActionRow onConfirm={onClose} data-testid="modalactionrow-lab-results-error" />
          </>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      {...modalProps}
      onPrint={() => printPDF('lab-results-printout')}
      data-testid="modal-lab-results-printout"
    >
      <PDFLoader
        isLoading={everything.isFetching}
        id="lab-results-printout"
        data-testid="pdfloader-lab-results-printout"
      >
        <LabResultsPrintout
          certificateData={certificateQuery.data}
          patientData={{
            ...patient,
            additionalData: additionalDataQuery.data,
            village: villageQuery.data ?? {},
          }}
          encounter={encounterQuery.data}
          labRequests={labRequestsWithDetails}
          getSetting={getSetting}
          translations={translations}
          primaryTimeZone={primaryTimeZone}
          data-testid="labresultsprintout-component"
        />
      </PDFLoader>
    </Modal>
  );
});
