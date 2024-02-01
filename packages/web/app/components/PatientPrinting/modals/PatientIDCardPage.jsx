import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocalisation } from '../../../contexts/Localisation';
import { Modal } from '../../Modal';
import { PDFViewer, printPDF } from '../PDFViewer';
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
          getLocalisation={getLocalisation}
        />
      </PDFViewer>
    </Modal>
  );
});
