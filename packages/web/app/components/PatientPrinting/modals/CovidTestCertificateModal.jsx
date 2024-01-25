import React, { useCallback, useState } from 'react';
import { CertificateTypes, CovidLabCertificate } from '@tamanu/shared/utils/patientCertificates';
import { ASSET_NAMES, ICAO_DOCUMENT_TYPES } from '@tamanu/constants';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientAdditionalDataQuery } from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';
import { useSettings } from '../../../contexts/Settings';

export const CovidTestCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getSetting } = useSettings();
  const api = useApi();
  const { watermark, logo, footerImg, printedBy } = useCertificate({
    footerAssetName: ASSET_NAMES.COVID_TEST_CERTIFICATE_FOOTER,
  });

  const { data: labTestsResponse, isLoading: isLabTestsLoading } = useCovidLabTestQuery(
    patient.id,
    CertificateTypes.test,
  );
  const {
    data: additionalData,
    isLoading: isAdditionalDataLoading,
  } = usePatientAdditionalDataQuery(patient.id);

  const isLoading = isLabTestsLoading || isAdditionalDataLoading;

  const createCovidTestCertNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
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
      onPrint={() => printPDF('test-certificate')}
      additionalActions={<EmailButton onEmail={createCovidTestCertNotification} />}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <PDFViewer id="test-certificate">
          <CovidLabCertificate
            patient={patientData}
            labs={labTestsResponse.data}
            watermarkSrc={watermark}
            signingSrc={footerImg}
            logoSrc={logo}
            getSetting={getSetting}
            printedBy={printedBy}
            certType={CertificateTypes.test}
          />
        </PDFViewer>
      )}
    </Modal>
  );
});
