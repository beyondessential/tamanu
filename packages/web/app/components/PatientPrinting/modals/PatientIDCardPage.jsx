import React, { useState } from 'react';
import { useSettings } from '../../../contexts/Settings';
import { Modal } from '../../Modal';
import { PDFViewer, printPDF } from '../PDFViewer';
import { IDCardPrintout } from '@tamanu/shared/utils/patientCertificates';

const cardDimensions = {
  width: '85.6mm',
  height: '53.92mm',
};

export const PatientIDCardPage = React.memo(({ patient, imageData }) => {
  const { getSetting } = useSettings();
  const measures = getSetting('printMeasures.idCardPage');
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="sm"
      printable
      keepMounted
      onPrint={() => printPDF('patient-card-printout')}
    >
      <PDFViewer id="patient-card-printout">
        <IDCardPrintout
          cardDimensions={cardDimensions}
          patientImageData={imageData}
          measures={measures}
          patient={patient}
          getSetting={getSetting}
        />
      </PDFViewer>
    </Modal>
  );
});
