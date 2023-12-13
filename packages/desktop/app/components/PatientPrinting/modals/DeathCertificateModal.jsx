import React, { useState } from 'react';
import { useCertificate } from '../../../utils/useCertificate';
import { Button } from '../../Button';
import { Modal } from '../../Modal';
import { DeathCertificate } from '../printouts/DeathCertificate';

export const DeathCertificateModal = ({ patient, deathData }) => {
  const [isOpen, setIsOpen] = useState();
  const patientData = { ...patient, ...deathData };

  const certificateData = useCertificate();

  return (
    <>
      <Modal
        title="Patient Death Certificate"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="md"
        printable
      >
        <DeathCertificate patientData={patientData} certificateData={certificateData} />
      </Modal>
      <Button variant="contained" color="primary" onClick={() => setIsOpen(true)}>
        View death certificate
      </Button>
    </>
  );
};
