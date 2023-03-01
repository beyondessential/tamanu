import React, { useEffect, useCallback, useState } from 'react';

import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { VaccineCertificate } from 'shared/utils/patientCertificates';

import { Modal } from '../../Modal';
import { useApi } from '../../../api';
import { EmailButton } from '../../Email/EmailButton';
import { useCertificate } from '../../../utils/useCertificate';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientAdditionalData } from '../../../api/queries';

import { PDFViewer, printPDF } from '../PDFViewer';

export const CovidImmunisationCertificateModal = React.memo(({ open, onClose, patient }) => {
  const api = useApi();
  const [vaccinations, setVaccinations] = useState([]);
  const { getLocalisation } = useLocalisation();
  const { watermark, logo, footerImg, printedBy } = useCertificate();
  const { data: additionalData } = usePatientAdditionalData(patient.id);

  useEffect(() => {
    api.get(`patient/${patient.id}/administeredVaccines`).then(response => {
      const certifiableVaccines = response.data.filter(vaccine => vaccine.certifiable);
      setVaccinations(certifiableVaccines);
    });
  }, [api, patient.id]);

  const createCovidImmunisationCertificateNotification = useCallback(
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
      additionalActions={<EmailButton onEmail={createCovidImmunisationCertificateNotification} />}
    >
      <PDFViewer id="covid-vaccine-certificate">
        <VaccineCertificate
          patient={patientData}
          vaccinations={vaccinations}
          watermarkSrc={watermark}
          logoSrc={logo}
          signingSrc={footerImg}
          printedBy={printedBy}
          getLocalisation={getLocalisation}
          covidCertified
        />
      </PDFViewer>
    </Modal>
  );
});
