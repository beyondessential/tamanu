import React, { useCallback, useEffect, useState } from 'react';

import { ASSET_NAMES, COVID_19_CLEARANCE_CERTIFICATE } from '@tamanu/constants';
import { CertificateTypes, CovidLabCertificate } from '@tamanu/shared/utils/patientCertificates';

import { useApi } from '../../../api';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { useLocalisation } from '../../../contexts/Localisation';
import { useCertificate } from '../../../utils/useCertificate';
import { EmailButton } from '../../Email/EmailButton';
import { Modal } from '../../Modal';

import { PDFViewer, printPDF } from '../PDFViewer';

export const CovidClearanceCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const [labs, setLabs] = useState([]);
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { watermark, logo, footerImg, printedBy } = useCertificate({
    footerAssetName: ASSET_NAMES.COVID_CLEARANCE_CERTIFICATE_FOOTER,
  });
  const { data: additionalData } = usePatientAdditionalDataQuery(patient.id);

  useEffect(() => {
    api
      .get(`patient/${patient.id}/covidLabTests`, { certType: CertificateTypes.clearance })
      .then(response => {
        setLabs(response.data);
      });
  }, [api, patient.id]);

  const createCovidTestCertNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: COVID_19_CLEARANCE_CERTIFICATE,
        requireSigning: false,
        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: printedBy,
      }),
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
