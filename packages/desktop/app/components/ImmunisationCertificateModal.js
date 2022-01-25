import React, { useCallback } from 'react';
import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { Modal } from './Modal';
import { connectApi, useApi } from '../api';
import { ImmunisationCertificate } from './ImmunisationCertificate';

const DumbImmunisationCertificateModal = ({ getImmunisations, open, onClose, patient }) => {
  const api = useApi();
  const [immunisations, setImmunisations] = React.useState();
  React.useEffect(() => {
    getImmunisations().then(setImmunisations);
  }, [getImmunisations]);

  const createImmunisationCertificateNotification = useCallback(() => {
    api.post('certificateNotification', {
      type: ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION,
      requireSigning: true,
      patientId: patient.id,
    });
  }, [api, patient]);

  const certificate = <ImmunisationCertificate patient={patient} immunisations={immunisations} />;
  return (
    <Modal
      title="Vaccination Certificate"
      open={open}
      onClose={onClose}
      width="md"
      printable
      onEmail={createImmunisationCertificateNotification}
    >
      {certificate}
    </Modal>
  );
};

export const ImmunisationCertificateModal = connectApi((api, dispatch, { patient }) => ({
  async getImmunisations() {
    const response = await api.get(`patient/${patient.id}/administeredVaccines`);
    return response.data;
  },
}))(DumbImmunisationCertificateModal);
