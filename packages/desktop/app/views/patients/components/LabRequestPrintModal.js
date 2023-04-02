import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import {
  useEncounterData,
  usePatientAdditionalData,
  useLabRequestNotes,
} from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';

import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { MultipleLabRequestsPrintout as LabRequestPrintout } from '../../../components/PatientPrinting';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificateData = useCertificate();

  const { data: encounterData, isLoading: encounterLoading } = useEncounterData(
    labRequest.encounterId,
  );
  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalData(
    patient.id,
  );
  const { data: notePages, isLoading: notesLoading } = useLabRequestNotes(labRequest.id);

  const { data: testsData, isLoading: testsLoading } = useQuery(
    ['labRequest', labRequest.id, 'tests'],
    () => api.get(`labRequest/${labRequest.id}/tests`),
  );

  const { data: village = {}, isLoading: villageQueryLoading } = useQuery(
    ['referenceData', patient.villageId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );

  const villageLoading = villageQueryLoading && !!patient?.villageId;

  return (
    <Modal title="Lab Request" open={open} onClose={onClose} width="md" printable>
      {encounterLoading ||
      additionalDataLoading ||
      villageLoading ||
      notesLoading ||
      testsLoading ? (
        <LoadingIndicator />
      ) : (
        <LabRequestPrintout
          patient={patient}
          labRequests={[{ ...labRequest, tests: testsData.data, notePages }]}
          encounter={encounterData}
          village={village}
          additionalData={additionalData}
          certificateData={certificateData}
        />
      )}
    </Modal>
  );
});
