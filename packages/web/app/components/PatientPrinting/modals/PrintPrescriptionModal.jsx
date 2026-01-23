import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';

import { PrescriptionPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSettings } from '../../../contexts/Settings';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedText } from '../../Translation/TranslatedText';
import { useEncounter } from '../../../contexts/Encounter';

export const PrintPrescriptionModal = ({ medication, patientWeight, open, onClose }) => {
  const { getSetting } = useSettings();
  const { data: certificateData, isFetching: isFetchingCertificate } = useCertificate();
  const api = useApi();
  const [patient, setPatient] = useState({});
  const [additionalData, setAdditionalData] = useState({});
  const [village, setVillage] = useState({});
  const [prescriber, setPrescriber] = useState({});
  const [patientLoading, setPatientLoading] = useState(false);
  const [additionalDataLoading, setAdditionalDataLoading] = useState(false);
  const [villageLoading, setVillageLoading] = useState(false);
  const [prescriberLoading, setPrescriberLoading] = useState(false);
  const { facilityId } = useAuth();
  const { encounter, isLoadingEncounter } = useEncounter();

  useEffect(() => {
    setPatientLoading(true);
    (async () => {
      if (encounter?.patientId) {
        const res = await api.get(`patient/${encounter.patientId}`);
        setPatient(res);
      }
      setPatientLoading(false);
    })();
  }, [api, encounter?.patientId]);

  useEffect(() => {
    setAdditionalDataLoading(true);
    (async () => {
      if (encounter?.patientId) {
        const res = await api.get(`patient/${encounter.patientId}/additionalData`);
        setAdditionalData(res);
      }
      setAdditionalDataLoading(false);
    })();
  }, [api, encounter?.patientId]);

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
    isLoadingEncounter ||
    patientLoading ||
    additionalDataLoading ||
    villageLoading ||
    prescriberLoading ||
    isFacilityLoading ||
    isFetchingCertificate;

  return (
    <>
      <Modal
        title={
          <TranslatedText
            stringId="medication.modal.print.title"
            fallback="Prescription"
            data-testid="translatedtext-aa0j"
          />
        }
        open={open}
        onClose={onClose}
        width="md"
        printable
        onPrint={() => printPDF('prescription-printout')}
        data-testid="modal-fdg7"
      >
        <PDFLoader isLoading={isLoading} id="prescription-printout" data-testid="pdfloader-ugi4">
          <PrescriptionPrintout
            patientData={{ ...patient, additionalData, village, patientWeight }}
            prescriptions={[medication]}
            certificateData={certificateData}
            facility={facility}
            prescriber={prescriber}
            getSetting={getSetting}
            data-testid="prescriptionprintout-95jw"
          />
        </PDFLoader>
      </Modal>
    </>
  );
};
