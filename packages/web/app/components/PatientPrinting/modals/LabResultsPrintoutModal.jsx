import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { useApi } from '../../../api';
import {
  useEncounterDataQuery,
  useLabRequestNotesQuery,
  usePatientAdditionalDataQuery,
} from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import { LabResultsPrintout } from '@tamanu/shared/utils/patientCertificates';

export const LabResultsPrintoutModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const api = useApi();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

  const { data: encounter, isLoading: isEncounterLoading } = useEncounterDataQuery(
    labRequest.encounterId,
  );

  const { data: additionalData, isLoading: isAdditionalDataLoading } =
    usePatientAdditionalDataQuery(patient.id);

  const { data: notes, isLoading: areNotesLoading } = useLabRequestNotesQuery(labRequest.id);

  const { data: testsData, isLoading: areTestsLoading } = useQuery(
    ['labRequest', labRequest.id, 'tests'],
    () => api.get(`labRequest/${labRequest.id}/tests`),
  );

  const isVillageEnabled = !!patient.villageId;
  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['referenceData', patient.villageId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    { enabled: isVillageEnabled },
  );

  const { data: publishedLog, isLoading: isPublishedLogLoading } = useQuery(
    ['labRequest', labRequest.id, 'latest-published'],
    () => api.get(`labRequest/${labRequest.id}/latest-published`),
  );

  const isLoading =
    isEncounterLoading ||
    areTestsLoading ||
    areNotesLoading ||
    isAdditionalDataLoading ||
    (isVillageEnabled && isVillageLoading) ||
    isCertificateFetching ||
    isPublishedLogLoading;

  const labRequestWithDetails = {
    ...labRequest,
    tests: testsData?.data,
    notes: notes?.data || [],
    publishedBy: publishedLog?.updatedBy,
  };

  return (
    <Modal
      title={
        <TranslatedText
          stringId="lab.modal.results.title"
          fallback="Lab results"
          data-testid="translatedtext-lab-results-title"
        />
      }
      open={open}
      onClose={onClose}
      width="md"
      color={Colors.white}
      printable
      onPrint={() => printPDF('lab-results-printout')}
      data-testid="modal-lab-results-printout"
    >
      <PDFLoader
        isLoading={isLoading}
        id="lab-results-printout"
        data-testid="pdfloader-lab-results-printout"
      >
        <LabResultsPrintout
          certificateData={certificateData}
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          labRequest={labRequestWithDetails}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
          data-testid="labresultsprintout-component"
        />
      </PDFLoader>
    </Modal>
  );
});


