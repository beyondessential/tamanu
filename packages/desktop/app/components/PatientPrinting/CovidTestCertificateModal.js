import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CovidLabCertificate, CertificateTypes } from 'shared/utils/patientCertificates';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { EmailButton } from '../Email/EmailButton';
import { PDFViewer, printPDF } from './PDFViewer';
import { useCertificate } from '../../utils/useCertificate';

export const CovidTestCertificateModal = ({ patient }) => {
  const [open, setOpen] = useState(true);
  const [labs, setLabs] = useState([]);
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { watermark, logo, footerImg, printedBy } = useCertificate();
  const { data: additionalData } = useQuery(['additionalData', patient.id], () =>
    api.get(`patient/${patient.id}/additionalData`),
  );

  useEffect(() => {
    api.get(`patient/${patient.id}/covidLabTests`).then(response => {
      setLabs(response.data);
    });
  }, [api, patient.id]);

  const createCovidTestCertNotification = useCallback(
    data => {
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
        requireSigning: false,
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
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      keepMounted
      onPrint={() => printPDF('test-certificate')}
      additionalActions={<EmailButton onEmail={createCovidTestCertNotification} />}
    >
      <PDFViewer id="test-certificate">
        <CovidLabCertificate
          patient={patientData}
          labs={labs}
          watermarkSrc={watermark}
          signingSrc={footerImg}
          logoSrc={logo}
          getLocalisation={getLocalisation}
          printedBy={printedBy}
          certType={CertificateTypes.test}
        />
      </PDFViewer>
    </Modal>
  );
};
