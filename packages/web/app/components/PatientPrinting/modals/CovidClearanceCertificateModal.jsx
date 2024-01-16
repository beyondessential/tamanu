import React, { useCallback, useState } from 'react';

import { CovidLabCertificate, CertificateTypes } from '@tamanu/shared/utils/patientCertificates';
import { COVID_19_CLEARANCE_CERTIFICATE, ASSET_NAMES } from '@tamanu/constants';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { useLocalisation } from '../../../contexts/Localisation';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientAdditionalDataQuery } from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';
import { LoadingIndicator } from '../../LoadingIndicator';
import { useCovidLabTestQuery } from '../../../api/queries/useCovidLabTestsQuery';

export const CovidClearanceCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getLocalisation } = useLocalisation();
  const api = useApi();
  const { watermark, logo, footerImg, printedBy } = useCertificate({
    footerAssetName: ASSET_NAMES.COVID_CLEARANCE_CERTIFICATE_FOOTER,
  });
  const {
    data: additionalData,
    isLoading: isAdditionalDataLoading,
  } = usePatientAdditionalDataQuery(patient.id);
  const { data: labTestsResponse, isLoading: isLabTestsLoading } = useCovidLabTestQuery(
    patient.id,
    CertificateTypes.clearance,
  );

  const isLoading = isLabTestsLoading || isAdditionalDataLoading;

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
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <PDFViewer id="clearance-certificate">
          <CovidLabCertificate
            patient={patientData}
            labs={labTestsResponse.data}
            watermarkSrc={watermark}
            signingSrc={footerImg}
            logoSrc={logo}
            getLocalisation={getLocalisation}
            printedBy={printedBy}
            certType={CertificateTypes.clearance}
          />
        </PDFViewer>
      )}
    </Modal>
  );
});
