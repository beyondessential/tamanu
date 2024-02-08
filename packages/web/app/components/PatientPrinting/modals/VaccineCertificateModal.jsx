import React, { useCallback } from 'react';

import { ASSET_NAMES, VACCINATION_CERTIFICATE } from '@tamanu/constants';
import { VaccineCertificate } from '@tamanu/shared/utils/patientCertificates';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { useLocalisation } from '../../../contexts/Localisation';
import {
  usePatientAdditionalDataQuery,
  useAdministeredVaccines,
  useReferenceData,
} from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';

export const VaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate({
    footerAssetName: ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER,
  });
  const {
    data: additionalData,
    isFetching: isAdditionalDataFetching,
  } = usePatientAdditionalDataQuery(patient.id);

  const { data: vaccineData, isFetching: isVaccineFetching } = useAdministeredVaccines(patient.id, {
    orderBy: 'date',
    order: 'ASC',
    invertNullDateOrdering: true,
    includeNotGiven: false,
  });
  const vaccinations = vaccineData?.data || [];

  const createVaccineCertificateNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: VACCINATION_CERTIFICATE,
        requireSigning: false,
        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: printedBy,
        createdAt: getCurrentDateString(),
      }),
    [api, patient.id, printedBy],
  );

  const village = useReferenceData(patient.villageId).data;
  const patientData = { ...patient, village, additionalData };
  const { logo, watermark, footerImg, printedBy } = certificateData;

  if (isAdditionalDataFetching || isVaccineFetching || isCertificateFetching) return null;

  return (
    <Modal
      title="Immunisation Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      keepMounted
      onPrint={() => printPDF('vaccine-certificate')}
      additionalActions={<EmailButton onEmail={createVaccineCertificateNotification} />}
    >
      <PDFViewer id="vaccine-certificate">
        <VaccineCertificate
          patient={patientData}
          vaccinations={vaccinations}
          watermarkSrc={watermark}
          logoSrc={logo}
          signingSrc={footerImg}
          printedBy={printedBy}
          printedDate={getCurrentDateString()}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Modal>
  );
});
