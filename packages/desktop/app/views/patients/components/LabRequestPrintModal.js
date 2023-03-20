import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useCertificate } from '../../../utils/useCertificate';

import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { MultipleLabRequestsPrintout as LabRequestPrintout } from '../../../components/PatientPrinting';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificateData = useCertificate();

  const { data: encounter, isLoading: encounterLoading } = useQuery(
    ['encounter', labRequest.encounterId],
    () => api.get(`encounter/${labRequest.encounterId}`),
  );

  const { data: additionalData, isLoading: additionalDataLoading } = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${encodeURIComponent(patient.id)}/additionalData`),
  );

  const { data: village = {}, isLoading: villageQueryLoading } = useQuery(
    ['village', patient.villageId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );

  const { data: notePages, isLoading: notesLoading } = useQuery(['notes', labRequest.id], () =>
    api.get(`labRequest/${labRequest.id}/notePages`),
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
