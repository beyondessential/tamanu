import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { LabRequestPrintout } from '../../../components/PatientPrinting/printouts/LabRequestPrintout';
import { Colors } from '../../../constants';
import { useEncounterData, usePatientAdditionalData } from '../../../api/queries';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificate = useCertificate();

  const { data: encounter, isLoading: isEncounterLoading } = useEncounterData(
    labRequest.encounterId,
  );
  const { data: tests, isLoading: areTestsLoading } = useQuery(
    ['labRequestTests', labRequest.id],
    async () => {
      const testsRes = await api.get(`labRequest/${encodeURIComponent(labRequest.id)}/tests`);
      return testsRes.data;
    },
  );
  const { data: additionalData, isLoading: isAdditionalDataLoading } = usePatientAdditionalData(
    patient.id,
  );
  const { data: notes, isLoading: areNotesLoading } = useQuery(
    ['labRequestNotes', labRequest.id],
    async () => {
      const notesRes = await api.get(`labRequest/${encodeURIComponent(labRequest.id)}/notes`);
      return notesRes.data;
    },
  );

  const isVillageEnabled = !!patient.villageId;
  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['village', patient.villageId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    { enabled: isVillageEnabled },
  );
  const isLoading =
    isEncounterLoading ||
    areTestsLoading ||
    areNotesLoading ||
    areTestsLoading ||
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
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <LabRequestPrintout
          labRequest={{ ...labRequest, tests, notes }}
          patient={patient}
          village={village}
          additionalData={additionalData}
          encounter={encounter}
          certificateData={certificate}
        />
      )}
    </Modal>
  );
});
