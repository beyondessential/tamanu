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

  const { data: encounter, isLoading: encounterLoading } = useEncounterData(labRequest.encounterId);
  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalData(
    patient.id,
  );
  const { data: notePages, isLoading: notesLoading } = useLabRequestNotes(labRequest.id);

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
      {encounterLoading || additionalDataLoading || villageLoading || notesLoading ? (
        <LoadingIndicator />
      ) : (
        <LabRequestPrintout
          certificateData={certificateData}
          patient={patient}
          additionalData={additionalData}
          village={village}
          encounter={encounter}
          labRequests={[{ ...labRequest, notePages }]}
        />
      )}
    </Modal>
  );
});
