import React, { useState } from 'react';
import { PDFLoader, printPDF } from '../PDFLoader';
import { IDLabelPrintout } from '@tamanu/shared/utils/patientCertificates';
import { Modal } from '@tamanu/ui-components';
import { useSettings } from '../../../contexts/Settings';

export const PatientStickerLabelPage = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const { getSetting } = useSettings();
  const measures = getSetting('printMeasures.stickerLabelPage');
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      onPrint={() => printPDF('patient-label-printout')}
      data-testid="modal-ncnz"
    >
      <PDFLoader id="patient-label-printout" data-testid="pdfloader-di0q">
        <IDLabelPrintout
          patient={patient}
          measures={measures}
          getSetting={getSetting}
          data-testid="idlabelprintout-m146"
        />
      </PDFLoader>
    </Modal>
  );
});
