import React from 'react';
import { Modal } from './Modal';
import { connectApi } from '../api/connectApi';
import { ImmunisationCertificate } from './ImmunisationCertificate';

const DumbImmunisationCertificateModal = ({ getImmunisations, open, onClose, patient }) => {
  const [immunisations, setImmunisations] = React.useState();
  React.useEffect(() => {
    getImmunisations().then(setImmunisations);
  }, [getImmunisations, setImmunisations]);

  const certificate = <ImmunisationCertificate patient={patient} immunisations={immunisations} />;
  return (
    <Modal title="Vaccination Certificate" open={open} onClose={onClose} width="md" printable>
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
