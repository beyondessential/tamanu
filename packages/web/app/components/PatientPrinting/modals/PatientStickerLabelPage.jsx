import React, { useState } from 'react';
import { useLocalisation } from '../../../contexts/Localisation';
import { PDFLoader, printPDF } from '../PDFLoader';
import { IDLabelPrintout } from '@tamanu/shared/utils/patientCertificates';
import { Modal } from '../../Modal';

export const PatientStickerLabelPage = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getLocalisation } = useLocalisation();
  const measures = getLocalisation('printMeasures.stickerLabelPage');
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      onPrint={() => printPDF('patient-label-printout')}
    >
      <PDFLoader id="patient-label-printout">
        <IDLabelPrintout patient={patient} measures={measures} />
      </PDFLoader>
    </Modal>
  );
});
