import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import {
  useEncounterData,
  useLabRequestNotes,
  usePatientAdditionalDataQuery,
} from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';

import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Colors } from '../../../constants';
import { PDFViewer, printPDF } from '../../../components/PatientPrinting/PDFViewer';
import { useLocalisation } from '../../../contexts/Localisation';
import { MultipleLabRequestsPrintout } from '@tamanu/shared/utils/patientCertificates';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const certificate = useCertificate();

  const { data: encounter, isLoading: isEncounterLoading } = useEncounterData(
    labRequest.encounterId,
  );

  const {
    data: additionalData,
    isLoading: isAdditionalDataLoading,
  } = usePatientAdditionalDataQuery(patient.id);

  const { data: notes, isLoading: areNotesLoading } = useLabRequestNotes(labRequest.id);

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

  const isLoading =
    isEncounterLoading ||
    areTestsLoading ||
    areNotesLoading ||
    isAdditionalDataLoading ||
    (isVillageEnabled && isVillageLoading);

  return (
    <Modal
      title="Lab Request"
      open={open}
      onClose={onClose}
      width="md"
      color={Colors.white}
      printable
      onPrint={() => printPDF('lab-request-printout')}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <PDFViewer id="lab-request-printout">
          <MultipleLabRequestsPrintout
            labRequests={[{ ...labRequest, tests: testsData.data, notes: notes?.data || [] }]}
            patientData={{ ...patient, additionalData, village }}
            encounter={encounter}
            certificateData={certificate}
            getLocalisation={getLocalisation}
          />
        </PDFViewer>
      )}
    </Modal>
  );
});
