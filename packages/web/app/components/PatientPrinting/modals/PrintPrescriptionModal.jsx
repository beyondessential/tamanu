import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';

import { PrescriptionPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { useSettings } from '../../../contexts/Settings';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintPrescriptionModal = ({ medication, patientWeight, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { data: certificateData, isFetching: isFetchingCertificate } = useCertificate();
  const api = useApi();
  const [encounter, setEncounter] = useState({});
  const [patient, setPatient] = useState({});
  const [additionalData, setAdditionalData] = useState({});
  const [village, setVillage] = useState({});
  const [prescriber, setPrescriber] = useState({});
  const [encounterLoading, setEncounterLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [additionalDataLoading, setAdditionalDataLoading] = useState(false);
  const [villageLoading, setVillageLoading] = useState(false);
  const [prescriberLoading, setPrescriberLoading] = useState(false);
  const { facilityId } = useAuth();

  useEffect(() => {
    setEncounterLoading(true);
    (async () => {
      if (medication.encounterId) {
        const res = await api.get(`encounter/${medication.encounterId}`);
        setEncounter(res);
      }
      setEncounterLoading(false);
    })();
  }, [api, medication.encounterId]);

  useEffect(() => {
    setPatientLoading(true);
    (async () => {
      if (encounter.patientId) {
        const res = await api.get(`patient/${encounter.patientId}`);
        setPatient(res);
      }
      setPatientLoading(false);
    })();
  }, [api, encounter.patientId]);

  useEffect(() => {
    setAdditionalDataLoading(true);
    (async () => {
      if (encounter.patientId) {
        const res = await api.get(`patient/${encounter.patientId}/additionalData`);
        setAdditionalData(res);
      }
      setAdditionalDataLoading(false);
    })();
  }, [api, encounter.patientId]);

  useEffect(() => {
    setVillageLoading(true);
    (async () => {
      if (patient.villageId) {
        const res = await api.get(`referenceData/${encodeURIComponent(patient.villageId)}`);
        setVillage(res);
      }
      setVillageLoading(false);
    })();
  }, [api, patient.villageId]);

  useEffect(() => {
    setPrescriberLoading(true);
    (async () => {
      if (medication.prescriberId) {
        const res = await api.get(`user/${encodeURIComponent(medication.prescriberId)}`);
        setPrescriber(res);
      }
      setPrescriberLoading(false);
    })();
  }, [api, medication.prescriberId]);

  const { data: facility, isLoading: isFacilityLoading } = useQuery(['facility', facilityId], () =>
    api.get(`facility/${encodeURIComponent(facilityId)}`),
  );

  const isLoading =
    encounterLoading ||
    patientLoading ||
    additionalDataLoading ||
    villageLoading ||
    prescriberLoading ||
    isFacilityLoading ||
    isFetchingCertificate;

  return (
    <>
      <Modal
        title={<TranslatedText
          stringId="medication.modal.print.title"
          fallback="Prescription"
          data-testid='translatedtext-b1sx' />}
        open={open}
        onClose={onClose}
        width="md"
        printable
        onPrint={() => printPDF('prescription-printout')}
      >
        <PDFLoader isLoading={isLoading} id="prescription-printout">
          <PrescriptionPrintout
            patientData={{ ...patient, additionalData, village, patientWeight }}
            prescriptions={[medication]}
            certificateData={certificateData}
            facility={facility}
            prescriber={prescriber}
            getLocalisation={getLocalisation}
            getSetting={getSetting}
          />
        </PDFLoader>
      </Modal>
    </>
  );
};
