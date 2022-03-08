import React, { useEffect, useCallback } from 'react';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { useSelector } from 'react-redux';
import { Modal } from './Modal';
import { useApi } from '../api';
import { ImmunisationCertificate } from './ImmunisationCertificate';
import { EmailButton } from './Email/EmailButton';
import { getCurrentUser } from '../store';

export const ImmunisationCertificateModal = ({ open, onClose, patient }) => {
  const api = useApi();
  const [immunisations, setImmunisations] = React.useState();
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

  const certificate = <ImmunisationCertificate patient={patient} immunisations={immunisations} />;
  return (
    <Modal
      title="Vaccination Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      additionalActions={<EmailButton onEmail={createImmunisationCertificateNotification} />}
    >
      {certificate}
    </Modal>
  );
};
