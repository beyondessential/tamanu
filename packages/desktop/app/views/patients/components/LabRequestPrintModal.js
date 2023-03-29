import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { LabRequestPrintout } from '../../../components/PatientPrinting/printouts/LabRequestPrintout';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificateData = useCertificate();

  const { data: encounterData, isLoading: encounterLoading } = useQuery(
    ['encounter', labRequest.encounterId],
    () => api.get(`encounter/${labRequest.encounterId}`),
  );

  const { data: testsData, isLoading: testsLoading } = useQuery(
    ['labRequest', labRequest.id, 'tests'],
    () => api.get(`labRequest/${labRequest.id}/tests`),
  );

  const { data: notesData, isLoading: notesLoading } = useQuery(
    ['labRequest', labRequest.id, 'notes'],
    () => api.get(`labRequest/${labRequest.id}/notes`),
  );

  return (
    <Modal title="Lab Request" open={open} onClose={onClose} width="md" printable>
      {encounterLoading || testsLoading || notesLoading ? (
        <LoadingIndicator />
      ) : (
        <LabRequestPrintout
          labRequestData={{ ...labRequest, tests: testsData.data, notes: notesData.data }}
          patientData={patient}
          encounterData={encounterData}
          certificateData={certificateData}
        />
      )}
    </Modal>
  );
});
