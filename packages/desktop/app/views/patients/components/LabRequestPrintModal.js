import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { LabRequestPrintout } from '../../../components/PatientPrinting/printouts/LabRequestPrintout';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificate = useCertificate();
  const [notes, setNotes] = useState([]);
  const [tests, setTests] = useState([]);
  const [encounter, setEncounter] = useState({});
  const [notesLoading, setNotesLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);
  const [encounterLoading, setEncounterLoading] = useState(false);

  useEffect(() => {
    setEncounterLoading(true);
    (async () => {
      const res = await api.get(`encounter/${labRequest.encounterId}`);
      setEncounter(res);
    })();
    setEncounterLoading(false);
  }, [api, labRequest.encounterId]);

  useEffect(() => {
    setTestsLoading(true);
    (async () => {
      const res = await api.get(`labRequest/${labRequest.id}/tests`);
      setTests(res.data);
    })();
    setTestsLoading(false);
  }, [api, labRequest.id]);
  useEffect(() => {
    setNotesLoading(true);
    (async () => {
      const res = await api.get(`labRequest/${labRequest.id}/notes`);
      setNotes(res.data);
    })();
    setNotesLoading(false);
  }, [api, labRequest.id]);
  const { data: additionalData, isLoading: isAdditionalDataLoading } = useQuery(
    ['additionalData', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}/additionalData`),
  );
  const isVillageEnabled = !!patient?.villageId;
  const { data: village = {}, isLoading: isVillageLoading } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: isVillageEnabled,
    },
  );
  const isLoading =
    encounterLoading ||
    testsLoading ||
    notesLoading ||
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
