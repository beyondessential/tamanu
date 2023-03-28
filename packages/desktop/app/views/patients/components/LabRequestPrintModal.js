import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { LabRequestPrintout } from '../../../components/PatientPrinting/printouts/LabRequestPrintout';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificate = useCertificate();

  const isEncounterEnabled = !!labRequest.encounterId;
  const { data: encounter, isLoading: isEncounterLoading } = useQuery(
    ['encounter', labRequest.encounterId],
    () => api.get(`encounter/${encodeURIComponent(labRequest.encounterId)}`),
    { enabled: isEncounterEnabled },
  );
  const { data: tests, isLoading: areTestsLoading } = useQuery(
    ['labRequestTests', labRequest.id],
    async () => {
      const notesRes = await api.get(`labRequest/${encodeURIComponent(labRequest.id)}/tests`);
      return notesRes.data;
    },
  );
  const { data: notes, isLoading: areNotesLoading } = useQuery(
    ['labRequestNotes', labRequest.id],
    async () => {
      const testsRes = await api.get(`labRequest/${encodeURIComponent(labRequest.id)}/notes`);
      return testsRes.data;
    },
  );
  const { data: additionalData, isLoading: isAdditionalDataLoading } = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${encodeURIComponent(patient.id)}/additionalData`),
  );
  const isVillageEnabled = !!patient?.villageId;
  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['village', patient.villageId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    { enabled: isVillageEnabled },
  );
  const isLoading =
    (isEncounterEnabled && isEncounterLoading) ||
    areTestsLoading ||
    areNotesLoading ||
    isAdditionalDataLoading ||
    (isVillageEnabled && isVillageLoading);

  return (
    <Modal title="Lab Request" open={open} onClose={onClose} width="md" printable>
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <LabRequestPrintout
          labRequest={{ ...labRequest, tests, notes }}
          patient={patient}
          village={village}
          additionalData={additionalData}
          encounter={encounter}
          certificate={certificate}
        />
      )}
    </Modal>
  );
});
