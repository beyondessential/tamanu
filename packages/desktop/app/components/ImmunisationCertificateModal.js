import React from 'react';
import { Modal } from './Modal';
import { connectApi } from '../api/connectApi';
import { ImmunisationCertificate } from './ImmunisationCertificate';

const DumbImmunisationCertificateModal = ({ getImmunisations, open, onClose, patient }) => {
  const [immunisations, setImmunisations] = React.useState();
  React.useEffect(() => {
    getImmunisations().then(setImmunisations);
  }, []);

  const certificate = <ImmunisationCertificate patient={patient} immunisations={immunisations} />;
  return (
    <Modal title="Immunisation Certificate" open={open} onClose={onClose} width="md" printable>
      {certificate}
    </Modal>
  );
};

export const ImmunisationCertificateModal = connectApi((api, dispatch, { patient }) => ({
  async getImmunisations() {
    const response = await api.get(`patient/${patient.id}/immunisations`);
    return response.data;
  },
}))(DumbImmunisationCertificateModal);
