import React, { useEffect, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { VaccineCertificate } from 'shared/utils/patientCertificates';
import { Modal } from './Modal';
import { useApi } from '../api';
import { EmailButton } from './Email/EmailButton';
import { useCertificate } from '../utils/useCertificate';
import { PDFViewer, printPDF } from './PatientPrinting/PDFViewer';
import { useLocalisation } from '../contexts/Localisation';

export const ImmunisationCertificateModal = ({ open, onClose, patient }) => {
  const api = useApi();
  const [vaccinations, setVaccinations] = useState([]);
  const { getLocalisation } = useLocalisation();
  const { watermark, logo, footerImg, printedBy } = useCertificate();
  const { data: additionalData } = useQuery(['additionalData', patient.id], () =>
    api.get(`patient/${patient.id}/additionalData`),
  );

  useEffect(() => {
    api.get(`patient/${patient.id}/administeredVaccines`).then(response => {
      setVaccinations(response.data);
    });
  }, [api, patient.id]);

  const createImmunisationCertificateNotification = useCallback(
    data => {
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,
        requireSigning: true,
        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: printedBy,
      });
    },
    [api, patient.id, printedBy],
  );

  const patientData = { ...patient, additionalData };

  return (
    <Modal
      title="Vaccination Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      keepMounted
      onPrint={() => printPDF('vaccine-certificate')}
      additionalActions={<EmailButton onEmail={createImmunisationCertificateNotification} />}
    >
      <PDFViewer id="vaccine-certificate">
        <VaccineCertificate
          patient={patientData}
          vaccinations={vaccinations}
          watermarkSrc={watermark}
          logoSrc={logo}
          signingSrc={footerImg}
          printedBy={printedBy}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Modal>
  );
};
