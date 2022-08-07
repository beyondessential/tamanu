import React, { useState, useEffect, useCallback } from 'react';
import { CovidLabCertificate } from 'shared/utils/patientCertificates';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { Modal } from '../Modal';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { EmailButton } from '../Email/EmailButton';
import { PDFViewer, printPDF } from './PDFViewer';
import { useCertificate } from '../../utils/useCertificate';

export const CovidClearanceCertificateModal = ({ patient }) => {
  const [open, setOpen] = useState(true);
  const [labs, setLabs] = useState([]);
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { watermark, logo, footerImg, printedBy } = useCertificate();

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

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      keepMounted
      onPrint={() => printPDF('clearance-certificate')}
      additionalActions={<EmailButton onEmail={createCovidTestCertNotification} />}
    >
      <PDFViewer id="clearance-certificate">
        <CovidLabCertificate
          patient={patient}
          labs={labs}
          watermarkSrc={watermark}
          signingSrc={footerImg}
          logoSrc={logo}
          getLocalisation={getLocalisation}
          printedBy={printedBy}
          certType="Clearance"
        />
      </PDFViewer>
    </Modal>
  );
};
