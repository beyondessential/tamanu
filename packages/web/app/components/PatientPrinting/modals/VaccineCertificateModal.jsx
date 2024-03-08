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
import { useAuth } from '../../../contexts/Auth';
import { useTranslation } from '../../../contexts/Translation';

export const VaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { facility } = useAuth();
  const { getLocalisation } = useLocalisation();
  const { getTranslation } = useTranslation();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate({
    footerAssetName: ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER,
  });
  const { logo, watermark, footerImg, printedBy } = certificateData;
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
  const vaccinations =
    vaccineData?.data.filter(vaccine => !vaccine.scheduledVaccine.hideFromCertificate) || [];

  const createVaccineCertificateNotification = useCallback(
    data =>
      api.post('certificateNotification', {
        type: VACCINATION_CERTIFICATE,
        requireSigning: false,
        patientId: patient.id,
        forwardAddress: data.email,
        facilityName: facility.name,
        createdBy: printedBy,
        createdAt: getCurrentDateString(),
      }),
    [api, patient.id, printedBy, facility.name],
  );

  const village = useReferenceData(patient.villageId).data;
  const patientData = { ...patient, village, additionalData };

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
          facilityName={facility.name}
          signingSrc={footerImg}
          printedBy={printedBy}
          printedDate={getCurrentDateString()}
          getLocalisation={getLocalisation}
          getTranslation={getTranslation}
        />
      </PDFViewer>
    </Modal>
  );
});
