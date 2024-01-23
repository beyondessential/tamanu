import React, { useEffect, useState } from 'react';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { LoadingIndicator } from '../../LoadingIndicator';
import { useApi } from '../../../api';

import { PrescriptionPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { PDFViewer, printPDF } from '../PDFViewer';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintPrescriptionModal = ({ medication, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
  const certificateData = useCertificate();
  const api = useApi();
  const [encounter, setEncounter] = useState({});
  const [patient, setPatient] = useState({});
  const [additionalData, setAdditionalData] = useState({});
  const [village, setVillage] = useState({});
  const [encounterLoading, setEncounterLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [additionalDataLoading, setAdditionalDataLoading] = useState(false);
  const [villageLoading, setVillageLoading] = useState(false);
  const { facility } = useAuth();

  useEffect(() => {
    setEncounterLoading(true);
    (async () => {
      if (medication.encounterId) {
        const res = await api.get(`encounter/${medication.encounterId}`);
        setEncounter(res);
      }
    })();
    setEncounterLoading(false);
  }, [api, medication.encounterId]);

  useEffect(() => {
    setPatientLoading(true);
    (async () => {
      if (encounter.patientId) {
        const res = await api.get(`patient/${encounter.patientId}`);
        setPatient(res);
      }
    })();
    setPatientLoading(false);
  }, [api, encounter.patientId]);

  useEffect(() => {
    setAdditionalDataLoading(true);
    (async () => {
      if (encounter.patientId) {
        const res = await api.get(`patient/${encounter.patientId}/additionalData`);
        setAdditionalData(res);
      }
    })();
    setAdditionalDataLoading(false);
  }, [api, encounter.patientId]);

  useEffect(() => {
    setVillageLoading(true);
    (async () => {
      if (patient.villageId) {
        const res = await api.get(`referenceData/${encodeURIComponent(patient.villageId)}`);
        setVillage(res);
      }
    })();
    setVillageLoading(false);
  }, [api, patient.villageId]);

  return (
    <>
      <Modal
        title={<TranslatedText stringId="medication.modal.print.title" fallback="Prescription" />}
        open={open}
        onClose={onClose}
        width="md"
        printable
        onPrint={() => printPDF('prescription-printout')}
      >
        {encounterLoading || patientLoading || additionalDataLoading || villageLoading ? (
          <LoadingIndicator />
        ) : (
          <PDFViewer id="prescription-printout">
            <PrescriptionPrintout
              patientData={{ ...patient, additionalData, village }}
              prescriptions={[medication]}
              certificateData={certificateData}
              facility={facility}
              getLocalisation={getLocalisation}
            />
          </PDFViewer>
        )}
      </Modal>
    </>
  );
};
