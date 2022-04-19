import React, { useEffect, useCallback, useState } from 'react';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { VaccineCertificate } from 'shared/utils';
import { useSelector } from 'react-redux';
import { Modal } from './Modal';
import { useApi } from '../api';
import { EmailButton } from './Email/EmailButton';
import { useCertificate } from '../utils/useCertificate';
import { getCurrentUser } from '../store';
import { PDFViewer, printPDF } from './PDFViewer';
import { useLocalisation } from '../contexts/Localisation';

export const ImmunisationCertificateModal = ({ open, onClose, patient }) => {
  const api = useApi();
  const [immunisations, setImmunisations] = useState([]);
  const { getLocalisation } = useLocalisation();
  const { watermark, logo, footerImg } = useCertificate();
  const currentUser = useSelector(getCurrentUser);
  const currentUserDisplayName = currentUser ? currentUser.displayName : '';

  useEffect(() => {
    api.get(`patient/${patient.id}/administeredVaccines`).then(response => {
      setImmunisations(response.data);
    });
  }, [api, patient.id]);

  const createImmunisationCertificateNotification = useCallback(
    data => {
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON,
        requireSigning: true,
        patientId: patient.id,
        forwardAddress: data.email,
        createdBy: currentUserDisplayName,
      });
    },
    [api, patient, currentUserDisplayName],
  );

  return (
    <Modal
      title="Vaccination Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      onPrint={() => printPDF('vaccine-certificate')}
      additionalActions={<EmailButton onEmail={createImmunisationCertificateNotification} />}
    >
      <PDFViewer id="vaccine-certificate">
        <VaccineCertificate
          patient={patient}
          vaccinations={immunisations}
          watermarkSrc={watermark}
          logoSrc={logo}
          signingSrc={footerImg}
          printedBy={currentUserDisplayName}
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Modal>
  );
};
