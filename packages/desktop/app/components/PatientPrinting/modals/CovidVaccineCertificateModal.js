import React, { useCallback } from 'react';

import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { CovidVaccineCertificate } from 'shared/utils/patientCertificates';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientAdditionalData, useAdministeredVaccines } from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';

export const CovidVaccineCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { watermark, logo, footerImg, printedBy } = useCertificate();
  const { data: additionalData } = usePatientAdditionalData(patient.id);

  const { data: vaccineData } = useAdministeredVaccines(patient.id, {
    order: [['date', 'ASC']],
  });
  const vaccinations = vaccineData?.data.filter(vaccine => vaccine.certifiable) || [];

  const createCovidVaccineCertificateNotification = useCallback(
    data => {
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,
        requireSigning: true,
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
      title="Vaccination Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      keepMounted
      onPrint={() => printPDF('covid-vaccine-certificate')}
      additionalActions={<EmailButton onEmail={createCovidVaccineCertificateNotification} />}
    >
      <PDFViewer id="covid-vaccine-certificate">
        <CovidVaccineCertificate
          patient={patientData}
          vaccinations={vaccinations}
          watermarkSrc={watermark}
          logoSrc={logo}
          signingSrc={footerImg}
          printedBy={printedBy}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Modal>
  );
});
