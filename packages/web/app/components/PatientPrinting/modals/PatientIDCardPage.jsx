import React, { useState } from 'react';
import { useLocalisation } from '../../../contexts/Localisation';
import { Modal } from '../../Modal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { IDCardPrintout } from '@tamanu/shared/utils/patientCertificates';

const cardDimensions = {
  width: '85.6mm',
  height: '53.92mm',
};

export const PatientIDCardPage = React.memo(({ patient, imageData }) => {
  const { getLocalisation } = useLocalisation();
  const measures = getLocalisation('printMeasures.idCardPage');
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
          getLocalisation={getLocalisation}
        />
      </PDFLoader>
    </Modal>
  );
});
