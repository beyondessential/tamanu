import React, { useState, useEffect, useCallback } from 'react';

import { CovidLabCertificate, CertificateTypes } from 'shared/utils/patientCertificates';
import { COVID_19_CLEARANCE_CERTIFICATE } from 'shared/constants';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientAdditionalData } from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';

export const CovidClearanceCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const [labs, setLabs] = useState([]);
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { watermark, logo, footerImg, printedBy } = useCertificate();
  const { data: additionalData } = usePatientAdditionalData(patient.id);

  useEffect(() => {
    api
      .get(`patient/${patient.id}/covidLabTests`, { certType: CertificateTypes.clearance })
      .then(response => {
        setLabs(response.data);
      });
  }, [api, patient.id]);

  const createCovidTestCertNotification = useCallback(
    data => {
      api.post('certificateNotification', {
        type: COVID_19_CLEARANCE_CERTIFICATE,
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
      onPrint={() => printPDF('clearance-certificate')}
      additionalActions={<EmailButton onEmail={createCovidTestCertNotification} />}
    >
      <PDFViewer id="clearance-certificate">
        <CovidLabCertificate
          patient={patientData}
          labs={labs}
          watermarkSrc={watermark}
          signingSrc={footerImg}
          logoSrc={logo}
          getLocalisation={getLocalisation}
          printedBy={printedBy}
          certType={CertificateTypes.clearance}
        />
      </PDFViewer>
    </Modal>
  );
});
