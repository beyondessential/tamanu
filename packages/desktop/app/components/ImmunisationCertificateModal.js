import React, { useEffect, useCallback, useState } from 'react';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { useSelector } from 'react-redux';
import { PDFViewer, usePDF } from '@react-pdf/renderer';
import { VaccineCertificate } from 'shared/utils';
import { Modal } from './Modal';
import { useApi } from '../api';
import { EmailButton } from './Email/EmailButton';
import { useCertificate } from '../utils/useCertificate';
import { getCurrentUser } from '../store';
import { useLocalisation } from '../contexts/Localisation';

export const ImmunisationCertificateModal = ({ open, onClose, patient }) => {
  const api = useApi();
  const [immunisations, setImmunisations] = useState();
  const { watermark, logo, footerImg } = useCertificate();
  const { getLocalisation } = useLocalisation();
  const currentUser = useSelector(getCurrentUser);
  const currentUserDisplayName = currentUser ? currentUser.displayName : '';

  useEffect(() => {
    (async () => {
      const response = await api.get(`patient/${patient.id}/administeredVaccines`);
      setImmunisations(response.data);
    })();
  }, [api, patient]);

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

  const isReady = logo !== null;
  console.log('is ready', logo, isReady);

  const Document = (
    <VaccineCertificate
      patient={patient}
      vaccinations={immunisations}
      getLocalisation={getLocalisation}
      watermarkSrc={watermark?.data}
      signingSrc={footerImg?.data}
      logoSrc={logo?.data}
    />
  );

  const [Instance, updateInstance] = usePDF({ document: Document });

  return (
    <Modal
      title="Vaccination Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      additionalActions={<EmailButton onEmail={createImmunisationCertificateNotification} />}
    >
      {isReady && (
        <PDFViewer width={800} height={1000} showToolbar={false}>
          <Instance />
        </PDFViewer>
      )}
    </Modal>
  );
};
