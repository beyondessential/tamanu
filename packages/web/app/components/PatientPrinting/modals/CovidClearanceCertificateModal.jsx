import React, { useCallback, useState } from 'react';

import { CertificateTypes, CovidLabCertificate } from '@tamanu/shared/utils/patientCertificates';
import { ASSET_NAMES, COVID_19_CLEARANCE_CERTIFICATE } from '@tamanu/constants';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { useSettings } from '../../../contexts/Settings';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientAdditionalDataQuery } from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';
import { LoadingIndicator } from '../../LoadingIndicator';
import { useCovidLabTestQuery } from '../../../api/queries/useCovidLabTestsQuery';

export const CovidClearanceCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getSetting } = useSettings();
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
            getSetting={getSetting}
            printedBy={printedBy}
            certType={CertificateTypes.clearance}
          />
        </PDFViewer>
      )}
    </Modal>
  );
});
