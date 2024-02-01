import React, { useState } from 'react';
import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { useCertificate } from '../../../utils/useCertificate';
import { PDFViewer, printPDF } from '../PDFViewer';
import { DeathCertificatePrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSettings } from '../../../contexts/Settings';

export const DeathCertificateModal = ({ patient, deathData }) => {
  const [isOpen, setIsOpen] = useState();
  const patientData = { ...patient, ...deathData };
  const { getSetting } = useSettings();
  const certificateData = useCertificate();

  return (
    <>
      <Modal
        title="Cause of death certificate"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="md"
        printable
        onPrint={() => printPDF('death-certificate-printout')}
      >
        <PDFViewer id="death-certificate-printout">
          <DeathCertificatePrintout
            patientData={patientData}
            certificateData={certificateData}
            getSetting={getSetting}
          />
        </PDFViewer>
      </Modal>
      <Button variant="contained" color="primary" onClick={() => setIsOpen(true)}>
        View death certificate
      </Button>
    </>
  );
};
