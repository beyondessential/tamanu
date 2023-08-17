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
import { MultipleLabRequestsPrintout } from '../../../components/PatientPrinting';
import { Colors } from '../../../constants';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificate = useCertificate();

  const { data: encounter, isLoading: isEncounterLoading } = useEncounterData(
    labRequest.encounterId,
  );

  const { data: additionalData, isLoading: isAdditionalDataLoading } = usePatientAdditionalData(
    patient.id,
  );

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
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <MultipleLabRequestsPrintout
          labRequests={[{ ...labRequest, tests: testsData.data, notes: notes?.data || [] }]}
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
