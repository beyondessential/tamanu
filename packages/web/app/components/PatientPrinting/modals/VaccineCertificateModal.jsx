import React, { useCallback } from 'react';

import { ASSET_NAMES, VACCINATION_CERTIFICATE } from '@tamanu/constants';
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

import { printPDF } from '../PDFLoader';
import { useAuth } from '../../../contexts/Auth';
import { WorkerRenderedPDFViewer } from '../WorkerRenderedPDFViewer';
import { LoadingIndicator } from '../../LoadingIndicator';

const VACCINE_CERTIFICATE_PDF_ID = 'vaccine-certificate';

export const VaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { facility } = useAuth();
  const { localisation } = useLocalisation();
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

  const { data: village, isFetching: isVillageFetching } = useReferenceData(patient.villageId);
  const patientData = { ...patient, village, additionalData };

  const isLoading =
    isVaccineFetching || isAdditionalDataFetching || isVillageFetching || isCertificateFetching;

  return (
    <Modal
      title="Immunisation Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      onPrint={() => printPDF(VACCINE_CERTIFICATE_PDF_ID)}
      additionalActions={<EmailButton onEmail={createVaccineCertificateNotification} />}
    >
      {isLoading ? (
        <LoadingIndicator height="500px" />
      ) : (
        <WorkerRenderedPDFViewer
          id={VACCINE_CERTIFICATE_PDF_ID}
          queryDeps={[patient.id]}
          vaccinations={vaccinations}
          patient={patientData}
          watermarkSrc={watermark}
          logoSrc={logo}
          facilityName={facility.name}
          signingSrc={footerImg}
          printedBy={printedBy}
          printedDate={getCurrentDateString()}
          localisation={localisation}
        />
      )}
    </Modal>
  );
});
