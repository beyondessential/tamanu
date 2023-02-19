import React, { useState, useEffect } from 'react';
import { useApi } from '../../../api';
import { useCertificate } from '../../../utils/useCertificate';
import { Modal } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { LabRequestPrintout } from '../../../components/PatientPrinting/LabRequestPrintout';

export const LabRequestPrintModal = React.memo(({ labRequest, patient, open, onClose }) => {
  const api = useApi();
  const certificateData = useCertificate();
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

  return (
    <>
      <Modal title="Lab Request" open={open} onClose={onClose} width="md" printable>
        {encounterLoading || testsLoading || notesLoading ? (
          <LoadingIndicator />
        ) : (
          <LabRequestPrintout
            labRequestData={{ ...labRequest, tests, notes }}
            patientData={patient}
            encounterData={encounter}
            certificateData={certificateData}
          />
        )}
      </Modal>
    </>
  );
});
