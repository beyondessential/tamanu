import React, { useState } from 'react';
import { useLocalisation } from '../../../contexts/Localisation';
import { PDFViewer, printPDF } from '../PDFViewer';
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
      keepMounted
      onPrint={() => printPDF('patient-label-printout')}
    >
      <PDFViewer id="patient-label-printout">
        <IDLabelPrintout patient={patient} measures={measures} />
      </PDFViewer>
    </Modal>
  );
});
