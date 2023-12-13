import React, { useCallback } from 'react';

import { ASSET_NAMES, VACCINATION_CERTIFICATE } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { VaccineCertificate } from '@tamanu/shared/utils/patientCertificates';

import { useApi } from '../../../api';
import { useAdministeredVaccines, usePatientAdditionalDataQuery } from '../../../api/queries';
import { useLocalisation } from '../../../contexts/Localisation';
import { useCertificate } from '../../../utils/useCertificate';
import { EmailButton } from '../../Email/EmailButton';
import { Modal } from '../../Modal';

import { PDFViewer, printPDF } from '../PDFViewer';

export const VaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { watermark, logo, footerImg, printedBy } = useCertificate({
    footerAssetName: ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER,
  });
  const { data: additionalData } = usePatientAdditionalDataQuery(patient.id);

  const { data: vaccineData } = useAdministeredVaccines(patient.id, {
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

  const patientData = { ...patient, additionalData };

  return (
    <Modal
      title="Vaccine Certificate"
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
