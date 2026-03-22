import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import {
  useEncounterDataQuery,
  useLabRequestNotesQuery,
  usePatientAdditionalDataQuery,
} from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal, useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { PDFLoader, printPDF } from '../../../components/PatientPrinting/PDFLoader';
import { useLocalisation } from '../../../contexts/Localisation';
import { useTranslation } from '../../../contexts/Translation';
import { useSettings } from '../../../contexts/Settings';
import { MultipleLabRequestsPrintout } from '@tamanu/shared/utils/patientCertificates';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const { primaryTimeZone } = useDateTime();
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

  const isLoading =
    isEncounterLoading ||
    areTestsLoading ||
    areNotesLoading ||
    isAdditionalDataLoading ||
    (isVillageEnabled && isVillageLoading) ||
    isCertificateFetching;

  return (
    <Modal
      title="Lab Request"
      open={open}
      onClose={onClose}
      width="md"
      color={Colors.white}
      printable
      onPrint={() => printPDF('lab-request-printout')}
      data-testid="modal-wdy6"
    >
      <PDFLoader isLoading={isLoading} id="lab-request-printout" data-testid="pdfloader-lgg6">
        <MultipleLabRequestsPrintout
          labRequests={[{ ...labRequest, tests: testsData?.data, notes: notes?.data || [] }]}
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          certificateData={certificateData}
          getLocalisation={getLocalisation}
          getTranslation={getTranslation}
          getSetting={getSetting}
          primaryTimeZone={primaryTimeZone}
          data-testid="multiplelabrequestsprintout-ttpy"
        />
      </PDFLoader>
    </Modal>
  );
});
