import React, { useState } from 'react';
import { Modal } from '../../Modal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { IDCardPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSettings } from '../../../contexts/Settings';
import { useTranslation } from '../../../contexts/Translation';

const cardDimensions = {
  width: '85.6mm',
  height: '53.92mm',
};

export const PatientIDCardPage = React.memo(({ patient, imageData }) => {
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const measures = getSetting('printMeasures.idCardPage');
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      onPrint={() => printPDF('patient-card-printout')}
    >
      <PDFLoader isLoading={!imageData} id="patient-card-printout">
        <IDCardPrintout
          cardDimensions={cardDimensions}
          patientImageData={imageData}
          measures={measures}
          patient={patient}
          getTranslation={getTranslation}
        />
      </PDFLoader>
    </Modal>
  );
});
